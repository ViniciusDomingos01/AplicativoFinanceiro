import type { FastifyReply } from "fastify"
import { z } from "zod"

export const dateSchema = z.iso.date()
export const centsSchema = z
  .string()
  .regex(/^(0|[1-9]\d{0,18})$/)
  .refine(
    (value) =>
      /^\d+$/.test(value) && BigInt(value) <= 9_223_372_036_854_775_807n,
    "Valor monetário excede o limite suportado.",
  )

export function sendValidationError(reply: FastifyReply, issues: z.ZodIssue[]) {
  return reply.code(400).send({
    error: "VALIDATION_ERROR",
    message: "Confira os dados informados.",
    fields: issues.map(({ path, message }) => ({
      field: path.join("."),
      message,
    })),
  })
}

export function jsonSafe<T>(value: T): T {
  if (typeof value === "bigint") return value.toString() as T
  if (value instanceof Date) return value
  if (Array.isArray(value)) return value.map(jsonSafe) as T
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, jsonSafe(entry)]),
    ) as T
  }
  return value
}

export function dateFromISO(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}
