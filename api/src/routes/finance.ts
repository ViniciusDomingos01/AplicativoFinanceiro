import type { FastifyInstance, FastifyReply } from "fastify"
import { TransactionType } from "../../generated/prisma/enums.js"
import type { Prisma } from "../../generated/prisma/client.js"
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
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.nativeEnum(TransactionType),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  icon: z.string().max(16).optional(),
})

const sourceSchema = z.object({ name: z.string().trim().min(1).max(80) })

const baselineSchema = z.object({
  initialBalanceCents: centsSchema,
  trackingStartDate: dateSchema,
})

const transactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  amountCents: centsSchema.refine(
    (value) => value !== "0",
    "O valor deve ser maior que zero.",
  ),
  description: z.string().trim().min(1).max(160),
  date: dateSchema,
  paymentMethod: z.string().trim().max(80).nullable().optional(),
  categoryId: z.string().uuid(),
  sourceId: z.string().uuid().nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
})

const transactionPatchSchema = transactionSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo para atualizar.",
  )

const transactionQuerySchema = z.object({
  from: dateSchema.optional(),
  through: dateSchema.optional(),
  type: z.nativeEnum(TransactionType).optional(),
  categoryId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
})

function notFound(reply: FastifyReply, resource: string) {
  return reply
    .code(404)
    .send({ error: "NOT_FOUND", message: `${resource} não encontrado.` })
}

function dateRange(from: Date, through: Date) {
  return { gte: from, lte: through }
}

export async function registerFinanceRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate)

  app.get("/baseline", async (request, reply) => {
    const baseline = await prisma.financialBaseline.findUnique({
      where: { userId: request.userId! },
    })
    return reply.send({ baseline: jsonSafe(baseline) })
  })

  app.put("/baseline", async (request, reply) => {
    const parsed = baselineSchema.safeParse(request.body)
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues)

    const baseline = await prisma.financialBaseline.upsert({
      where: { userId: request.userId! },
      create: {
        userId: request.userId!,
        initialBalanceCents: BigInt(parsed.data.initialBalanceCents),
        trackingStartDate: dateFromISO(parsed.data.trackingStartDate),
      },
      update: {
        initialBalanceCents: BigInt(parsed.data.initialBalanceCents),
        trackingStartDate: dateFromISO(parsed.data.trackingStartDate),
      },
    })
    return reply.send({ baseline: jsonSafe(baseline) })
  })

  app.get("/categories", async (request) => {
    return prisma.category.findMany({
      where: { userId: request.userId! },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    })
  })

  app.post("/categories", async (request, reply) => {
    const parsed = categorySchema.safeParse(request.body)
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues)
    const category = await prisma.category.create({
      data: { ...parsed.data, userId: request.userId! },
    })
    return reply.code(201).send(category)
  })

  app.patch("/categories/:id", async (request, reply) => {
    const id = z
      .string()
      .uuid()
      .safeParse((request.params as { id?: string }).id)
    const parsed = categorySchema
      .partial()
      .refine((value) => Object.keys(value).length > 0)
      .safeParse(request.body)
    if (!id.success) return sendValidationError(reply, id.error.issues)
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues)
    const existing = await prisma.category.findFirst({
      where: { id: id.data, userId: request.userId! },
    })
    if (!existing) return notFound(reply, "Categoria")
    if (parsed.data.type && parsed.data.type !== existing.type) {
      const [transactionCount, budgetCount] = await Promise.all([
        prisma.transaction.count({
          where: { userId: request.userId!, categoryId: existing.id },
        }),
        prisma.budget.count({
          where: { userId: request.userId!, categoryId: existing.id },
        }),
      ])
      if (transactionCount || budgetCount) {
        return reply
          .code(409)
          .send({
            error: "CATEGORY_IN_USE",
            message:
              "Não é possível trocar o tipo de uma categoria já utilizada.",
          })
      }
    }
    const updated = await prisma.category.update({
      where: { id: existing.id },
      data: parsed.data,
    })
    return reply.send(updated)
  })

  app.delete("/categories/:id", async (request, reply) => {
    const id = z
      .string()
      .uuid()
      .safeParse((request.params as { id?: string }).id)
    if (!id.success) return sendValidationError(reply, id.error.issues)
    const deleted = await prisma.category.deleteMany({
      where: { id: id.data, userId: request.userId! },
    })
    if (!deleted.count) return notFound(reply, "Categoria")
    return reply.code(204).send()
  })

  app.get("/sources", async (request) => {
    return prisma.financialSource.findMany({
      where: { userId: request.userId! },
      orderBy: { name: "asc" },
    })
  })

  app.post("/sources", async (request, reply) => {
    const parsed = sourceSchema.safeParse(request.body)
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues)
    const source = await prisma.financialSource.create({
      data: { ...parsed.data, userId: request.userId! },
    })
    return reply.code(201).send(source)
  })

  app.patch("/sources/:id", async (request, reply) => {
    const id = z
      .string()
      .uuid()
      .safeParse((request.params as { id?: string }).id)
    const parsed = sourceSchema
      .partial()
      .refine((value) => Object.keys(value).length > 0)
      .safeParse(request.body)
    if (!id.success) return sendValidationError(reply, id.error.issues)
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues)
    const existing = await prisma.financialSource.findFirst({
      where: { id: id.data, userId: request.userId! },
    })
    if (!existing) return notFound(reply, "Origem")
    const updated = await prisma.financialSource.update({
      where: { id: existing.id },
      data: parsed.data,
    })
    return reply.send(updated)
  })

  app.delete("/sources/:id", async (request, reply) => {
    const id = z
      .string()
      .uuid()
      .safeParse((request.params as { id?: string }).id)
    if (!id.success) return sendValidationError(reply, id.error.issues)
    const existing = await prisma.financialSource.findFirst({
      where: { id: id.data, userId: request.userId! },
    })
    if (!existing) return notFound(reply, "Origem")
    await prisma.$transaction([
      prisma.transaction.updateMany({
        where: { sourceId: existing.id, userId: request.userId! },
        data: { sourceId: null },
      }),
      prisma.financialSource.delete({ where: { id: existing.id } }),
    ])
    return reply.code(204).send()
  })

  app.get("/transactions", async (request, reply) => {
    const parsed = transactionQuerySchema.safeParse(request.query)
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues)
    const baseline = await prisma.financialBaseline.findUnique({
      where: { userId: request.userId! },
    })
    const query = parsed.data
    if (!baseline)
      return reply
        .code(409)
        .send({
          error: "BASELINE_REQUIRED",
          message:
            "Defina o patrimônio e a data inicial antes de consultar movimentações.",
        })
    const requestedFrom = query.from
      ? dateFromISO(query.from)
      : baseline.trackingStartDate
    const from =
      requestedFrom < baseline.trackingStartDate
        ? baseline.trackingStartDate
        : requestedFrom
    const today = dateFromISO(new Date().toISOString().slice(0, 10))
    const through = query.through ? dateFromISO(query.through) : today
    if (from > through)
      return reply
        .code(400)
        .send({
          error: "INVALID_DATE_RANGE",
          message: "O início do período deve anteceder o fim.",
        })

    return prisma.transaction
      .findMany({
        where: {
          userId: request.userId!,
          date: dateRange(from, through),
          ...(query.type ? { type: query.type } : {}),
          ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        },
        include: { category: true, source: true },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: query.limit,
      })
      .then(jsonSafe)
  })

  app.get("/transactions/:id", async (request, reply) => {
    const id = z
      .string()
      .uuid()
      .safeParse((request.params as { id?: string }).id)
    if (!id.success) return sendValidationError(reply, id.error.issues)
    const transaction = await prisma.transaction.findFirst({
      where: { id: id.data, userId: request.userId! },
      include: { category: true, source: true },
    })
    if (!transaction) return notFound(reply, "Transação")
    return reply.send(jsonSafe(transaction))
  })

  app.post("/transactions", async (request, reply) => {
    const parsed = transactionSchema.safeParse(request.body)
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues)
    const input = parsed.data
    const [category, baseline] = await Promise.all([
      prisma.category.findFirst({
        where: {
          id: input.categoryId,
          userId: request.userId!,
          type: input.type,
        },
      }),
      prisma.financialBaseline.findUnique({
        where: { userId: request.userId! },
      }),
    ])
    if (!category)
      return reply
        .code(400)
        .send({
          error: "INVALID_CATEGORY",
          message: "A categoria não existe para este tipo de transação.",
        })
    if (!baseline)
      return reply
        .code(409)
        .send({
          error: "BASELINE_REQUIRED",
          message:
            "Defina o patrimônio e a data inicial antes de registrar transações.",
        })
    if (dateFromISO(input.date) < baseline.trackingStartDate) {
      return reply
        .code(400)
        .send({
          error: "BEFORE_TRACKING_START",
          message:
            "Essa movimentação é anterior ao patrimônio inicial e não deve ser registrada novamente.",
        })
    }
    if (input.sourceId) {
      const source = await prisma.financialSource.findFirst({
        where: { id: input.sourceId, userId: request.userId! },
      })
      if (!source)
        return reply
          .code(400)
          .send({
            error: "INVALID_SOURCE",
            message: "A origem informada não existe para este usuário.",
          })
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...input,
        userId: request.userId!,
        amountCents: BigInt(input.amountCents),
        date: dateFromISO(input.date),
        paymentMethod: input.paymentMethod ?? null,
        sourceId: input.sourceId ?? null,
        note: input.note ?? null,
      },
      include: { category: true, source: true },
    })
    return reply.code(201).send(jsonSafe(transaction))
  })

  app.patch("/transactions/:id", async (request, reply) => {
    const id = z
      .string()
      .uuid()
      .safeParse((request.params as { id?: string }).id)
    const parsed = transactionPatchSchema.safeParse(request.body)
    if (!id.success) return sendValidationError(reply, id.error.issues)
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues)
    const userId = request.userId!
    const existing = await prisma.transaction.findFirst({
      where: { id: id.data, userId },
    })
    if (!existing) return notFound(reply, "Transação")
    const baseline = await prisma.financialBaseline.findUnique({
      where: { userId },
    })
    const nextDate = parsed.data.date
      ? dateFromISO(parsed.data.date)
      : existing.date
    if (baseline && nextDate < baseline.trackingStartDate) {
      return reply
        .code(400)
        .send({
          error: "BEFORE_TRACKING_START",
          message: "A data não pode anteceder o início do acompanhamento.",
        })
    }
    const nextType = parsed.data.type ?? existing.type
    const nextCategory = parsed.data.categoryId ?? existing.categoryId
    const category = await prisma.category.findFirst({
      where: { id: nextCategory, userId, type: nextType },
    })
    if (!category)
      return reply
        .code(400)
        .send({
          error: "INVALID_CATEGORY",
          message: "A categoria não existe para este tipo de transação.",
        })
    if (parsed.data.sourceId) {
      const source = await prisma.financialSource.findFirst({
        where: { id: parsed.data.sourceId, userId },
      })
      if (!source)
        return reply
          .code(400)
          .send({
            error: "INVALID_SOURCE",
            message: "A origem informada não existe para este usuário.",
          })
    }
    const transaction = await prisma.transaction.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        ...(parsed.data.amountCents === undefined
          ? {}
          : { amountCents: BigInt(parsed.data.amountCents) }),
        ...(parsed.data.date === undefined
          ? {}
          : { date: dateFromISO(parsed.data.date) }),
      } as Prisma.TransactionUncheckedUpdateInput,
      include: { category: true, source: true },
    })
    return reply.send(jsonSafe(transaction))
  })

  app.delete("/transactions/:id", async (request, reply) => {
    const id = z
      .string()
      .uuid()
      .safeParse((request.params as { id?: string }).id)
    if (!id.success) return sendValidationError(reply, id.error.issues)
    const deleted = await prisma.transaction.deleteMany({
      where: { id: id.data, userId: request.userId! },
    })
    if (!deleted.count) return notFound(reply, "Transação")
    return reply.code(204).send()
  })

  app.get("/summary", async (request, reply) => {
    const periodSchema = z.object({
      from: dateSchema.optional(),
      through: dateSchema.optional(),
    })
    const parsed = periodSchema.safeParse(request.query)
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues)
    const userId = request.userId!
    const [baseline, categories] = await Promise.all([
      prisma.financialBaseline.findUnique({ where: { userId } }),
      prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    ])
    if (!baseline)
      return reply
        .code(409)
        .send({
          error: "BASELINE_REQUIRED",
          message:
            "Defina o patrimônio e a data inicial para gerar relatórios.",
        })

    const requestedFrom = parsed.data.from
      ? dateFromISO(parsed.data.from)
      : baseline.trackingStartDate
    const through = parsed.data.through
      ? dateFromISO(parsed.data.through)
      : dateFromISO(new Date().toISOString().slice(0, 10))
    if (requestedFrom > through)
      return reply
        .code(400)
        .send({
          error: "INVALID_DATE_RANGE",
          message: "O início do período deve anteceder o fim.",
        })
    if (through < baseline.trackingStartDate)
      return reply
        .code(400)
        .send({
          error: "PERIOD_BEFORE_TRACKING_START",
          message:
            "O período precisa incluir a data de início do acompanhamento.",
        })
    const from =
      requestedFrom < baseline.trackingStartDate
        ? baseline.trackingStartDate
        : requestedFrom
    const balanceThrough = through

    const chartStart = new Date(
      Date.UTC(through.getUTCFullYear(), through.getUTCMonth() - 4, 1),
    )
    const effectiveChartStart =
      chartStart < baseline.trackingStartDate
        ? baseline.trackingStartDate
        : chartStart
    const [
      periodSums,
      periodTransactions,
      balanceTransactions,
      goalReserve,
      trendRows,
    ] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId, date: dateRange(from, through) },
        _sum: { amountCents: true },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          type: TransactionType.EXPENSE,
          date: dateRange(from, through),
        },
        select: { categoryId: true, amountCents: true, date: true, type: true },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: baseline.trackingStartDate, lte: balanceThrough },
        },
        select: { amountCents: true, type: true, date: true },
      }),
      prisma.goalContribution.aggregate({
        where: { goal: { userId }, date: { lte: balanceThrough } },
        _sum: { amountCents: true },
      }),
      prisma.transaction.groupBy({
        by: ["date", "type"],
        where: { userId, date: dateRange(effectiveChartStart, through) },
        _sum: { amountCents: true },
      }),
    ])

    const incomeCents =
      periodSums.find((item) => item.type === TransactionType.INCOME)?._sum
        .amountCents ?? 0n
    const expenseCents =
      periodSums.find((item) => item.type === TransactionType.EXPENSE)?._sum
        .amountCents ?? 0n
    const estimatedCents = estimatedBalanceCents(
      baseline.initialBalanceCents,
      baseline.trackingStartDate,
      balanceThrough,
      balanceTransactions,
    )
    const reservedCents = goalReserve._sum.amountCents ?? 0n
    const byCategory = new Map<string, bigint>()
    for (const transaction of periodTransactions) {
      byCategory.set(
        transaction.categoryId,
        (byCategory.get(transaction.categoryId) ?? 0n) +
          transaction.amountCents,
      )
    }
    const spendingCategories = categories
      .filter((category) => category.type === TransactionType.EXPENSE)
      .map((category) => {
        const amountCents = byCategory.get(category.id) ?? 0n
        return {
          id: category.id,
          name: category.name,
          amountCents,
          percentage:
            expenseCents > 0n
              ? Number((amountCents * 10_000n) / expenseCents) / 100
              : 0,
          color: category.color,
          icon: category.icon,
        }
      })
      .filter((category) => category.amountCents > 0n)

    const monthTotals = new Map<string, {
      month: string
      income: bigint
      expenses: bigint
    }>()
    for (const row of trendRows) {
      const monthKey = row.date.toISOString().slice(0, 7)
      const month = new Date(`${monthKey}-01T12:00:00.000Z`).toLocaleDateString(
        "pt-BR",
        { month: "short", timeZone: "UTC" },
      )
      const current = monthTotals.get(monthKey) ?? {
        month,
        income: 0n,
        expenses: 0n,
      }
      if (row.type === TransactionType.INCOME)
        current.income += row._sum.amountCents ?? 0n
      else current.expenses += row._sum.amountCents ?? 0n
      monthTotals.set(monthKey, current)
    }
    const monthlyData = [...monthTotals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, month]) => ({
        month: month.month
          .replace(/\.$/, "")
          .replace(/^./, (char) => char.toUpperCase()),
        incomeCents: month.income,
        expensesCents: month.expenses,
      }))

    return reply.send(
      jsonSafe({
        period: { from, through },
        initialBalanceCents: baseline.initialBalanceCents,
        estimatedBalanceCents: estimatedCents,
        reservedForGoalsCents: reservedCents,
        availableBalanceCents: estimatedCents - reservedCents,
        incomeCents,
        expensesCents: expenseCents,
        netCents: incomeCents - expenseCents,
        savingsRatePercent:
          incomeCents > 0n
            ? Number(((incomeCents - expenseCents) * 10_000n) / incomeCents) /
              100
            : null,
        spendingCategories,
        monthlyData,
      }),
    )
  })
}
