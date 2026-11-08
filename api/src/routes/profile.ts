import type { FastifyInstance, FastifyReply } from "fastify"
import { z } from "zod"
import { authenticate } from "../auth.js"
import { prisma } from "../db.js"

const profilePatchSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(32).nullable().optional(),
    monthlyIncomeCents: z.string().regex(/^\d+$/).nullable().optional(),
    financialGoal: z.string().trim().max(240).nullable().optional(),
    notificationsEnabled: z.boolean().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo para atualizar.",
  )

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

function serializeProfile(profile: {
  id: string
  userId: string
  name: string
  phone: string | null
  monthlyIncomeCents: bigint | null
  financialGoal: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...profile,
    monthlyIncomeCents: profile.monthlyIncomeCents?.toString() ?? null,
  }
}

export async function registerProfileRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.userId! },
      include: { profile: true, preferences: true, baseline: true },
    })
    if (!user)
      return reply
        .code(404)
        .send({ error: "NOT_FOUND", message: "Perfil não encontrado." })

    return reply.send({
      id: user.id,
      email: user.email,
      profile: user.profile ? serializeProfile(user.profile) : null,
      preferences: user.preferences,
      baseline: user.baseline
        ? {
            ...user.baseline,
            initialBalanceCents: user.baseline.initialBalanceCents.toString(),
          }
        : null,
    })
  })

  app.patch("/", { preHandler: authenticate }, async (request, reply) => {
    const parsed = profilePatchSchema.safeParse(request.body)
    if (!parsed.success) return validationResponse(reply, parsed.error.issues)
    const { notificationsEnabled, monthlyIncomeCents, ...profileFields } =
      parsed.data
    const userId = request.userId!

    const result = await prisma.$transaction(async (tx) => {
      const profile =
        Object.keys(profileFields).length || monthlyIncomeCents !== undefined
          ? await tx.profile.update({
              where: { userId },
              data: {
                ...profileFields,
                ...(monthlyIncomeCents === undefined
                  ? {}
                  : {
                      monthlyIncomeCents:
                        monthlyIncomeCents === null
                          ? null
                          : BigInt(monthlyIncomeCents),
                    }),
              },
            })
          : await tx.profile.findUnique({ where: { userId } })

      const preferences =
        notificationsEnabled === undefined
          ? await tx.userPreferences.findUnique({ where: { userId } })
          : await tx.userPreferences.upsert({
              where: { userId },
              create: { userId, notificationsEnabled },
              update: { notificationsEnabled },
            })

      return { profile, preferences }
    })

    return reply.send({
      profile: result.profile ? serializeProfile(result.profile) : null,
      preferences: result.preferences,
    })
  })
}
