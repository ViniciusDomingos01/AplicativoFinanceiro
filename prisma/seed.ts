import { Algorithm, hash } from "@node-rs/argon2"
import { TransactionType } from "../api/generated/prisma/enums.js"
import { DEFAULT_CATEGORIES } from "../api/src/default-categories.js"
import { config } from "../api/src/config.js"
import { prisma } from "../api/src/db.js"

const demoAccounts = [
  {
    email: "demo@fineduca.test",
    password: "demo1234demo",
    name: "Marina Demonstração",
    complete: true,
  },
  {
    email: "novo@fineduca.test",
    password: "teste1234novo",
    name: "Alex Primeiro Acesso",
    complete: false,
  },
] as const

function utcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day))
}

function getDemoPeriod(today: Date) {
  const currentMonth = utcDate(today.getUTCFullYear(), today.getUTCMonth(), 1)
  return utcDate(
    currentMonth.getUTCFullYear(),
    currentMonth.getUTCMonth() - 6,
    1,
  )
}

function isLoopbackDatabase() {
  try {
    const hostname = new URL(config.DATABASE_URL).hostname.toLowerCase()
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]"
    )
  } catch {
    return false
  }
}

async function createDemoAccount(
  account: typeof demoAccounts[number],
  today: Date,
) {
  const existing = await prisma.user.findUnique({
    where: { email: account.email },
    select: { id: true },
  })
  if (existing) {
    console.info(`Seed preservado: ${account.email} já existe.`)
    return
  }

  const passwordHash = await hash(account.password, {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  })

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: account.email,
        passwordHash,
        profile: {
          create: {
            name: account.name,
            ...(account.complete
              ? {
                  monthlyIncomeCents: 495_000n,
                  financialGoal: "Organizar gastos e formar uma reserva",
                }
              : {}),
          },
        },
        preferences: { create: {} },
      },
    })

    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((category) => ({
        ...category,
        userId: user.id,
      })),
    })

    if (!account.complete) return

    const categories = await tx.category.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, type: true },
    })
    const categoryByName = new Map(
      categories.map((category) => [category.name, category]),
    )
    const category = (name: string) => {
      const found = categoryByName.get(name)
      if (!found) throw new Error(`Categoria demonstrativa ausente: ${name}`)
      return found
    }

    const baselineDate = getDemoPeriod(today)
    await tx.financialBaseline.create({
      data: {
        userId: user.id,
        initialBalanceCents: 1_250_000n,
        trackingStartDate: baselineDate,
      },
    })

    const [everyday, cash, savings] = await Promise.all([
      tx.financialSource.create({
        data: { userId: user.id, name: "Conta do exemplo" },
      }),
      tx.financialSource.create({
        data: { userId: user.id, name: "Dinheiro em espécie" },
      }),
      tx.financialSource.create({
        data: { userId: user.id, name: "Poupança do exemplo" },
      }),
    ])

    const emergencyGoal = await tx.goal.create({
      data: {
        userId: user.id,
        title: "Reserva de emergência (exemplo)",
        targetCents: 1_000_000n,
      },
    })
    const studyGoal = await tx.goal.create({
      data: {
        userId: user.id,
        title: "Curso de educação financeira (exemplo)",
        targetCents: 300_000n,
      },
    })

    const transactionTemplates = [
      {
        day: 3,
        type: TransactionType.INCOME,
        amountCents: 420_000n,
        description: "Salário mensal (exemplo)",
        categoryName: "Salário",
        source: everyday,
        paymentMethod: "Transferência",
      },
      {
        day: 7,
        type: TransactionType.EXPENSE,
        amountCents: 155_000n,
        description: "Moradia mensal (exemplo)",
        categoryName: "Moradia",
        source: everyday,
        paymentMethod: "PIX",
      },
      {
        day: 11,
        type: TransactionType.EXPENSE,
        amountCents: 88_000n,
        description: "Compras de mercado (exemplo)",
        categoryName: "Alimentação",
        source: cash,
        paymentMethod: "Cartão de débito",
      },
      {
        day: 15,
        type: TransactionType.INCOME,
        amountCents: 75_000n,
        description: "Renda extra (exemplo)",
        categoryName: "Renda extra",
        source: savings,
        paymentMethod: "Transferência",
      },
      {
        day: 19,
        type: TransactionType.EXPENSE,
        amountCents: 28_000n,
        description: "Transporte (exemplo)",
        categoryName: "Transporte",
        source: cash,
        paymentMethod: "Dinheiro",
      },
      {
        day: 23,
        type: TransactionType.EXPENSE,
        amountCents: 32_000n,
        description: "Curso (exemplo)",
        categoryName: "Educação",
        source: everyday,
        paymentMethod: "Cartão de crédito",
      },
      {
        day: 27,
        type: TransactionType.EXPENSE,
        amountCents: 45_000n,
        description: "Lazer (exemplo)",
        categoryName: "Lazer",
        source: cash,
        paymentMethod: "Cartão de débito",
      },
    ] as const

    const monthCursor = new Date(baselineDate)
    while (monthCursor <= today) {
      const year = monthCursor.getUTCFullYear()
      const monthIndex = monthCursor.getUTCMonth()
      for (const item of transactionTemplates) {
        const date = utcDate(year, monthIndex, item.day)
        if (date > today) continue
        await tx.transaction.create({
          data: {
            userId: user.id,
            categoryId: category(item.categoryName).id,
            sourceId: item.source.id,
            type: item.type,
            amountCents: item.amountCents,
            description: item.description,
            date,
            paymentMethod: item.paymentMethod,
            note: "Registro fictício para demonstração; não representa movimentação bancária.",
          },
        })
      }

      const contributionDate = utcDate(
        year,
        monthIndex,
        Math.min(28, new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()),
      )
      if (contributionDate <= today) {
        await tx.goalContribution.createMany({
          data: [
            {
              goalId: emergencyGoal.id,
              amountCents: 35_000n,
              date: contributionDate,
              note: "Reserva declarada de demonstração; não é receita.",
            },
            {
              goalId: studyGoal.id,
              amountCents: 15_000n,
              date: contributionDate,
              note: "Reserva declarada de demonstração; não é receita.",
            },
          ],
        })
      }

      for (const [name, limitCents] of [
        ["Moradia", 175_000n],
        ["Alimentação", 115_000n],
        ["Lazer", 55_000n],
      ] as const) {
        await tx.budget.create({
          data: {
            userId: user.id,
            categoryId: category(name).id,
            year,
            month: monthIndex + 1,
            limitCents,
          },
        })
      }
      monthCursor.setUTCMonth(monthCursor.getUTCMonth() + 1)
    }

    await tx.lessonProgress.createMany({
      data: ["l1", "l2", "l3"].map((lessonId) => ({
        userId: user.id,
        courseId: "1",
        lessonId,
        completedAt: today,
      })),
    })
    await tx.quizAttempt.createMany({
      data: [
        {
          userId: user.id,
          courseId: "1",
          lessonId: "l2",
          score: 8,
          total: 10,
          passed: true,
          xpAwarded: 80,
          attemptedAt: today,
        },
        {
          userId: user.id,
          courseId: "1",
          lessonId: "l3",
          score: 9,
          total: 10,
          passed: true,
          xpAwarded: 90,
          attemptedAt: today,
        },
      ],
    })
  })
  console.info(`Conta demonstrativa criada: ${account.email}`)
}

async function main() {
  if (config.NODE_ENV === "production") {
    throw new Error("O seed demonstrativo é desativado em produção.")
  }
  if (!isLoopbackDatabase()) {
    throw new Error("O seed só pode ser executado contra um banco local.")
  }

  const today = utcDate(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  )
  for (const account of demoAccounts) await createDemoAccount(account, today)

  console.info(
    "Seed local concluído; nenhum dado de usuário existente foi sobrescrito.",
  )
}

main()
  .catch((error: unknown) => {
    console.error(
      "Falha ao executar o seed local.",
      error instanceof Error ? error.message : "Erro desconhecido.",
    )
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
