import type { FastifyInstance } from "fastify"
import { authenticate } from "../auth.js"
import { prisma } from "../db.js"
import { jsonSafe, sendValidationError } from "../http.js"
import { z } from "zod"

const quizAttemptSchema = z.object({
  courseId: z.string().trim().min(1).max(80),
  lessonId: z.string().trim().min(1).max(80),
  score: z.number().int().min(0).max(100),
  total: z.number().int().min(1).max(100),
})

export async function registerLearningRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate)

  app.get("/progress", async (request) => {
    const userId = request.userId!
    const [lessons, attempts] = await Promise.all([
      prisma.lessonProgress.findMany({
        where: { userId },
        select: { courseId: true, lessonId: true, completedAt: true },
        orderBy: { completedAt: "asc" },
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        select: {
          courseId: true,
          lessonId: true,
          score: true,
          total: true,
          passed: true,
          xpAwarded: true,
          attemptedAt: true,
        },
        orderBy: { attemptedAt: "desc" },
      }),
    ])
    const xp = attempts.reduce((sum, attempt) => sum + attempt.xpAwarded, 0)
    return { lessons, attempts, xp }
  })

  app.post("/quiz-attempts", async (request, reply) => {
    const parsed = quizAttemptSchema.safeParse(request.body)
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues)
    if (parsed.data.score > parsed.data.total) {
      return reply
        .code(400)
        .send({
          error: "INVALID_SCORE",
          message: "A pontuação não pode superar o total de questões.",
        })
    }

    const userId = request.userId!
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const priorAttempts = await tx.quizAttempt.count({
            where: {
              userId,
              courseId: parsed.data.courseId,
              lessonId: parsed.data.lessonId,
            },
          })
          const passed = parsed.data.score / parsed.data.total >= 0.7
          const attempt = await tx.quizAttempt.create({
            data: {
              userId,
              courseId: parsed.data.courseId,
              lessonId: parsed.data.lessonId,
              score: parsed.data.score,
              total: parsed.data.total,
              passed,
              xpAwarded: priorAttempts === 0 ? parsed.data.score * 10 : 0,
            },
          })
          if (passed) {
            await tx.lessonProgress.upsert({
              where: {
                userId_courseId_lessonId: {
                  userId,
                  courseId: parsed.data.courseId,
                  lessonId: parsed.data.lessonId,
                },
              },
              create: {
                userId,
                courseId: parsed.data.courseId,
                lessonId: parsed.data.lessonId,
                completedAt: new Date(),
              },
              update: { completedAt: new Date() },
            })
          }
          return { attempt, passed }
        },
        { isolationLevel: "Serializable" },
      )

      return reply.code(201).send(jsonSafe(result))
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2034"
      ) {
        return reply
          .code(409)
          .send({
            error: "RETRY_REQUIRED",
            message: "Tente registrar o resultado novamente.",
          })
      }
      throw error
    }
  })
}
