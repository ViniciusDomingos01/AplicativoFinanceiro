import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import Fastify from "fastify"
import { Prisma } from "../generated/prisma/client.js"
import { registerAuthRoutes } from "./routes/auth.js"
import { registerProfileRoutes } from "./routes/profile.js"
import { registerFinanceRoutes } from "./routes/finance.js"
import { registerGoalRoutes } from "./routes/goals.js"
import { registerBudgetRoutes } from "./routes/budgets.js"
import { registerLearningRoutes } from "./routes/learning.js"
import { config } from "./config.js"
import { prisma } from "./db.js"

export async function buildApp() {
  const app = Fastify({
    logger: config.NODE_ENV !== "test",
    bodyLimit: 64 * 1024,
    trustProxy: config.NODE_ENV === "production",
  })

  await app.register(helmet)
  await app.register(cors, {
    origin: config.WEB_ORIGIN,
    credentials: true,
  })
  await app.register(cookie)
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
  })

  app.decorateRequest("userId", null)

  app.get("/api/health/live", async () => ({ status: "ok" }))
  app.get("/api/health/ready", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return { status: "ok", database: "connected" }
    } catch {
      return reply.code(503).send({
        error: "SERVICE_UNAVAILABLE",
        message: "O serviço de dados está indisponível.",
      })
    }
  })

  await app.register(registerAuthRoutes, { prefix: "/api/v1/auth" })
  await app.register(registerProfileRoutes, { prefix: "/api/v1/profile" })
  await app.register(registerFinanceRoutes, { prefix: "/api/v1/finance" })
  await app.register(registerGoalRoutes, { prefix: "/api/v1/goals" })
  await app.register(registerBudgetRoutes, { prefix: "/api/v1/budgets" })
  await app.register(registerLearningRoutes, { prefix: "/api/v1/learning" })

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({
      error: "NOT_FOUND",
      message: "Rota não encontrada.",
    })
  })

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "Erro não tratado na API")
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return reply.code(409).send({
          error: "CONFLICT",
          message: "Já existe um registro com esses dados.",
        })
      }
      if (error.code === "P2003" || error.code === "P2014") {
        return reply.code(409).send({
          error: "RELATED_RECORD_EXISTS",
          message: "Este registro está relacionado a outros dados.",
        })
      }
      if (error.code === "P2025") {
        return reply.code(404).send({
          error: "NOT_FOUND",
          message: "Registro não encontrado.",
        })
      }
    }
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number" &&
      error.statusCode < 500
        ? error.statusCode
        : 500
    reply.code(statusCode).send({
      error: statusCode === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR",
      message:
        statusCode === 500
          ? "Ocorreu um erro inesperado."
          : error instanceof Error
            ? error.message
            : "A solicitação é inválida.",
    })
  })

  app.addHook("onClose", async () => prisma.$disconnect())
  return app
}
