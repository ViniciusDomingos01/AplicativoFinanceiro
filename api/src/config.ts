import "dotenv/config"
import { z } from "zod"

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_HOST: z.literal("127.0.0.1").default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  WEB_ORIGIN: z.string().url().default("http://127.0.0.1:8443"),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(168),
})

const parsed = environmentSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n")
  throw new Error(`Configuração de ambiente inválida:\n${issues}`)
}

export const config = parsed.data
