import { config as loadDotenv } from "dotenv"
import { join } from "node:path"
import { defineConfig, env } from "prisma/config"

const environmentFile =
  process.env.FINEDUCA_ENV_FILE ??
  (process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, "FinEduca", ".env")
    : ".env")
loadDotenv({ path: environmentFile })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
})
