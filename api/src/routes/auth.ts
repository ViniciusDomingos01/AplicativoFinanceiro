import { Algorithm, hash, verify } from "@node-rs/argon2"
import type { FastifyInstance, FastifyReply } from "fastify"
import { z } from "zod"
import { DEFAULT_CATEGORIES } from "../default-categories.js"
import {
  clearSessionCookie,
  createSessionToken,
  hashSessionToken,
  setSessionCookie,
  SESSION_COOKIE,
  authenticate,
} from "../auth.js"
import { config } from "../config.js"
import { prisma } from "../db.js"

const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
})

const registrationSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(120),
})

function validationResponse(reply: FastifyReply, issues: z.ZodIssue[]) {
  return reply.code(400).send({
    error: "VALIDATION_ERROR",
    message: "Confira os dados informados.",
    fields: issues.map(({ path, message }) => ({
      field: path.join("."),
      message,
    })),
  })
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post(
    "/register",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (request, reply) => {
      const parsed = registrationSchema.safeParse(request.body)
      if (!parsed.success) return validationResponse(reply, parsed.error.issues)

      const { email, password, name } = parsed.data
      const passwordHash = await hash(password, {
        algorithm: Algorithm.Argon2id,
        memoryCost: 19_456,
        timeCost: 2,
        parallelism: 1,
      })
      const token = createSessionToken()
      const expiresAt = new Date(
        Date.now() + config.SESSION_TTL_HOURS * 60 * 60 * 1000,
      )

      try {
        const created = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              passwordHash,
              profile: { create: { name } },
              preferences: { create: {} },
            },
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  name: true,
                  phone: true,
                  monthlyIncomeCents: true,
                  financialGoal: true,
                },
              },
            },
          })
          await tx.category.createMany({
            data: DEFAULT_CATEGORIES.map((category) => ({
              ...category,
              userId: user.id,
            })),
          })
          await tx.session.create({
            data: {
              userId: user.id,
              tokenHash: hashSessionToken(token),
              expiresAt,
            },
          })
          return user
        })

        setSessionCookie(reply, token)
        return reply.code(201).send({ user: created })
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002"
        ) {
          return reply.code(409).send({
            error: "EMAIL_ALREADY_REGISTERED",
            message: "Não foi possível criar uma conta com esses dados.",
          })
        }
        throw error
      }
    },
  )

  app.post(
    "/login",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (request, reply) => {
      const parsed = credentialsSchema.safeParse(request.body)
      if (!parsed.success) return validationResponse(reply, parsed.error.issues)

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email },
        select: { id: true, email: true, passwordHash: true },
      })
      const validPassword = user
        ? await verify(user.passwordHash, parsed.data.password)
        : false
      if (!user || !validPassword) {
        return reply.code(401).send({
          error: "INVALID_CREDENTIALS",
          message: "E-mail ou senha inválidos.",
        })
      }

      const token = createSessionToken()
      const expiresAt = new Date(
        Date.now() + config.SESSION_TTL_HOURS * 60 * 60 * 1000,
      )
      await prisma.session.create({
        data: {
          userId: user.id,
          tokenHash: hashSessionToken(token),
          expiresAt,
        },
      })
      setSessionCookie(reply, token)
      return reply.send({ user: { id: user.id, email: user.email } })
    },
  )

  app.post("/logout", async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE]
    if (token) {
      await prisma.session.deleteMany({
        where: { tokenHash: hashSessionToken(token) },
      })
    }
    clearSessionCookie(reply)
    return reply.code(204).send()
  })

  app.get("/session", { preHandler: authenticate }, async (request, reply) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.userId! },
      include: { profile: true, preferences: true },
    })
    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile
          ? {
              ...user.profile,
              monthlyIncomeCents:
                user.profile.monthlyIncomeCents?.toString() ?? null,
            }
          : null,
        preferences: user.preferences,
      },
    })
  })
}
