import type { FastifyInstance } from "fastify"
import { TransactionType } from "../../generated/prisma/enums.js"
import { authenticate } from "../auth.js"
import { prisma } from "../db.js"
import {
  centsSchema,
  dateFromISO,
  jsonSafe,
  sendValidationError,
} from "../http.js"
import { z } from "zod"

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)
const budgetSchema = z.object({
  categoryId: z.string().uuid(),
  month: monthSchema,
  limitCents: centsSchema.refine((value) => value !== "0"),
})

function monthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number)
  return {
    year,
    month: monthNumber,
    from: dateFromISO(`${month}-01`),
    through: new Date(Date.UTC(year, monthNumber, 0)),
  }
}

export async function registerBudgetRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate)

  app.get("/", async (request, reply) => {
    const query = z.object({ month: monthSchema }).safeParse(request.query)
    if (!query.success) return sendValidationError(reply, query.error.issues)
    const { year, month, from, through } = monthRange(query.data.month)
    const userId = request.userId!
    const [budgets, baseline] = await Promise.all([
      prisma.budget.findMany({
        where: { userId, year, month },
        include: { category: true },
        orderBy: { category: { name: "asc" } },
      }),
      prisma.financialBaseline.findUnique({ where: { userId } }),
    ])
    const effectiveFrom =
      baseline && baseline.trackingStartDate > from
        ? baseline.trackingStartDate
        : from
    const totals =
      effectiveFrom > through
        ? []
        : await prisma.transaction.groupBy({
            by: ["categoryId"],
            where: {
              userId,
              type: TransactionType.EXPENSE,
              date: { gte: effectiveFrom, lte: through },
            },
            _sum: { amountCents: true },
          })
    const spent = new Map(
      totals.map((item) => [item.categoryId, item._sum.amountCents ?? 0n]),
    )
    return reply.send(
      jsonSafe(
        budgets.map((budget) => {
          const spentCents = spent.get(budget.categoryId) ?? 0n
          return {
            ...budget,
            spentCents,
            remainingCents: budget.limitCents - spentCents,
            percentage:
              Number((spentCents * 10_000n) / budget.limitCents) / 100,
          }
        }),
      ),
    )
  })

  app.put("/", async (request, reply) => {
    const parsed = budgetSchema.safeParse(request.body)
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues)
    const { year, month } = monthRange(parsed.data.month)
    const userId = request.userId!
    const category = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        userId,
        type: TransactionType.EXPENSE,
      },
    })
    if (!category) {
      return reply
        .code(400)
        .send({
          error: "INVALID_CATEGORY",
          message: "O orçamento exige uma categoria de despesa deste usuário.",
        })
    }
    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_year_month: {
          userId,
          categoryId: category.id,
          year,
          month,
        },
      },
      create: {
        userId,
        categoryId: category.id,
        year,
        month,
        limitCents: BigInt(parsed.data.limitCents),
      },
      update: { limitCents: BigInt(parsed.data.limitCents) },
      include: { category: true },
    })
    return reply.send(jsonSafe(budget))
  })

  app.delete("/:id", async (request, reply) => {
    const id = z
      .string()
      .uuid()
      .safeParse((request.params as { id?: string }).id)
    if (!id.success) return sendValidationError(reply, id.error.issues)
    const deleted = await prisma.budget.deleteMany({
      where: { id: id.data, userId: request.userId! },
    })
    if (!deleted.count)
      return reply
        .code(404)
        .send({ error: "NOT_FOUND", message: "Orçamento não encontrado." })
    return reply.code(204).send()
  })
}
