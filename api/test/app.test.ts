import assert from "node:assert/strict"
import test from "node:test"

process.env.NODE_ENV = "test"
process.env.DATABASE_URL ??= "postgresql://fineduca:fineduca_dev@localhost:5432/fineduca?schema=public"

const { buildApp } = await import("../src/app.js")

test("API expõe health check independente do banco", async () => {
  const app = await buildApp()
  const response = await app.inject({ method: "GET", url: "/api/health/live" })

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.json(), { status: "ok" })
  await app.close()
})

test("API comunica indisponibilidade do PostgreSQL na prontidão", async () => {
  const app = await buildApp()
  const response = await app.inject({ method: "GET", url: "/api/health/ready" })

  assert.equal(response.statusCode, 503)
  assert.deepEqual(response.json(), {
    error: "SERVICE_UNAVAILABLE",
    message: "O serviço de dados está indisponível.",
  })
  await app.close()
})

test("API responde 404 estruturado para caminhos inexistentes", async () => {
  const app = await buildApp()
  const response = await app.inject({ method: "GET", url: "/api/does-not-exist" })

  assert.equal(response.statusCode, 404)
  assert.equal(response.json().error, "NOT_FOUND")
  await app.close()
})
