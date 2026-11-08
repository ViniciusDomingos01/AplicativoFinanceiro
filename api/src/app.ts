import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import Fastify from "fastify"
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

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({
      error: "NOT_FOUND",
      message: "Rota não encontrada.",
    })
  })

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "Erro não tratado na API")
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
