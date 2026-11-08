import type { FastifyInstance, FastifyReply } from "fastify"
import type { Prisma } from "../../generated/prisma/client.js"
import { z } from "zod"
import { authenticate } from "../auth.js"
import { prisma } from "../db.js"
import {
  centsSchema,
  dateFromISO,
  dateSchema,
  jsonSafe,
  sendValidationError,
} from "../http.js"
import { estimatedBalanceCents } from "../money.js"

const goalSchema = z.object({
  title: z.string().trim().min(1).max(120),
  targetCents: centsSchema.refine((value) => value !== "0"),
  deadline: dateSchema.nullable().optional(),
})
const goalPatchSchema = goalSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0)
const contributionSchema = z.object({
  amountCents: centsSchema.refine((value) => value !== "0"),
  date: dateSchema,
  note: z.string().trim().max(240).nullable().optional(),
})

function notFound(reply: FastifyReply) {
  return reply
    .code(404)
    .send({ error: "NOT_FOUND", message: "Meta não encontrada." })
}

export async function registerGoalRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate)

  app.get("/", async (request) => {
    const goals = await prisma.goal.findMany({
      where: { userId: request.userId! },
      include: {
        contributions: {
          where: { date: { lte: new Date() } },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    })
    return jsonSafe(
      goals.map((goal) => ({
        ...goal,
        currentReservedCents: goal.contributions.reduce(
          (sum, item) => sum + item.amountCents,
          0n,
        ),
      })),
    )
  })

  app.post("/", async (request, reply) => {
    const parsed = goalSchema.safeParse(request.body)
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues)
    const goal = await prisma.goal.create({
      data: {
        userId: request.userId!,
        title: parsed.data.title,
        targetCents: BigInt(parsed.data.targetCents),
        deadline: parsed.data.deadline
          ? dateFromISO(parsed.data.deadline)
          : null,
      },
    })
    return reply.code(201).send(jsonSafe({ ...goal, currentReservedCents: 0n }))
  })

  app.patch("/:id", async (request, reply) => {
    const id = z
      .string()
      .uuid()
      .safeParse((request.params as { id?: string }).id)
    const parsed = goalPatchSchema.safeParse(request.body)
    if (!id.success) return sendValidationError(reply, id.error.issues)
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues)
    const existing = await prisma.goal.findFirst({
      where: { id: id.data, userId: request.userId! },
    })
    if (!existing) return notFound(reply)
    const data: Prisma.GoalUncheckedUpdateInput = {
      ...(parsed.data.title === undefined ? {} : { title: parsed.data.title }),
      ...(parsed.data.targetCents === undefined
        ? {}
        : { targetCents: BigInt(parsed.data.targetCents) }),
      ...(parsed.data.deadline === undefined
        ? {}
        : {
            deadline: parsed.data.deadline
              ? dateFromISO(parsed.data.deadline)
              : null,
          }),
    }
    const goal = await prisma.goal.update({
      where: { id: existing.id },
      data,
    })
    const contributions = await prisma.goalContribution.aggregate({
      where: { goalId: goal.id, date: { lte: new Date() } },
      _sum: { amountCents: true },
    })
    return reply.send(
      jsonSafe({
        ...goal,
        currentReservedCents: contributions._sum.amountCents ?? 0n,
      }),
    )
  })

  app.delete("/:id", async (request, reply) => {
    const id = z
      .string()
      .uuid()
      .safeParse((request.params as { id?: string }).id)
    if (!id.success) return sendValidationError(reply, id.error.issues)
    const deleted = await prisma.goal.deleteMany({
      where: { id: id.data, userId: request.userId! },
    })
    if (!deleted.count) return notFound(reply)
    return reply.code(204).send()
  })

  app.post("/:id/contributions", async (request, reply) => {
    const id = z
      .string()
      .uuid()
      .safeParse((request.params as { id?: string }).id)
    const parsed = contributionSchema.safeParse(request.body)
    if (!id.success) return sendValidationError(reply, id.error.issues)
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues)
    const userId = request.userId!
    const amountCents = BigInt(parsed.data.amountCents)
    const contributionDate = dateFromISO(parsed.data.date)
    if (contributionDate > new Date()) {
      return reply
        .code(400)
        .send({
          error: "INVALID_DATE",
          message: "A contribuição deve ter uma data até hoje.",
        })
    }

    const contribution = await prisma.$transaction(
      async (tx) => {
        const [goal, baseline] = await Promise.all([
          tx.goal.findFirst({ where: { id: id.data, userId } }),
          tx.financialBaseline.findUnique({ where: { userId } }),
        ])
        if (!goal) return null
        if (!baseline)
          throw Object.assign(
            new Error("Defina o patrimônio inicial antes de reservar valores."),
            { statusCode: 409 },
          )
        if (contributionDate < baseline.trackingStartDate) {
          throw Object.assign(
            new Error(
              "A contribuição deve estar dentro do período de acompanhamento.",
            ),
            { statusCode: 400 },
          )
        }
        const [transactions, reserved, goalReserved] = await Promise.all([
          tx.transaction.findMany({
            where: {
              userId,
              date: { gte: baseline.trackingStartDate, lte: contributionDate },
            },
            select: { amountCents: true, type: true, date: true },
          }),
          tx.goalContribution.aggregate({
            where: { goal: { userId }, date: { lte: contributionDate } },
            _sum: { amountCents: true },
          }),
          tx.goalContribution.aggregate({
            where: { goalId: goal.id, date: { lte: contributionDate } },
            _sum: { amountCents: true },
          }),
        ])
        const estimated = estimatedBalanceCents(
          baseline.initialBalanceCents,
          baseline.trackingStartDate,
          contributionDate,
          transactions,
        )
        const available = estimated - (reserved._sum.amountCents ?? 0n)
        if (amountCents > available) {
          throw Object.assign(
            new Error(
              "O valor supera o saldo disponível estimado para essa data.",
            ),
            { statusCode: 409 },
          )
        }
        const currentGoalReserve = goalReserved._sum.amountCents ?? 0n
        if (currentGoalReserve + amountCents > goal.targetCents) {
          throw Object.assign(
            new Error("O valor supera o que falta reservar para esta meta."),
            { statusCode: 409 },
          )
        }
        return tx.goalContribution.create({
          data: {
            goalId: goal.id,
            amountCents,
            date: contributionDate,
            note: parsed.data.note ?? null,
          },
        })
      },
      { isolationLevel: "Serializable" },
    )

    if (!contribution) return notFound(reply)
    return reply.code(201).send(jsonSafe(contribution))
  })

  app.delete(
    "/:goalId/contributions/:contributionId",
    async (request, reply) => {
      const params = z
        .object({
          goalId: z.string().uuid(),
          contributionId: z.string().uuid(),
        })
        .safeParse(request.params)
      if (!params.success)
        return sendValidationError(reply, params.error.issues)
      const goal = await prisma.goal.findFirst({
        where: { id: params.data.goalId, userId: request.userId! },
      })
      if (!goal) return notFound(reply)
      const deleted = await prisma.goalContribution.deleteMany({
        where: { id: params.data.contributionId, goalId: goal.id },
      })
      if (!deleted.count)
        return reply
          .code(404)
          .send({ error: "NOT_FOUND", message: "Contribuição não encontrada." })
      return reply.code(204).send()
    },
  )
}
