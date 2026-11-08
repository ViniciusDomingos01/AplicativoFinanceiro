import assert from "node:assert/strict"
import test from "node:test"

process.env.NODE_ENV = "test"
process.env.DATABASE_URL ??=
  "postgresql://fineduca:fineduca_dev@localhost:5432/fineduca?schema=public"

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
  const response = await app.inject({
    method: "GET",
    url: "/api/does-not-exist",
  })

  assert.equal(response.statusCode, 404)
  assert.equal(response.json().error, "NOT_FOUND")
  await app.close()
})

test("perfil exige uma sessão autenticada", async () => {
  const app = await buildApp()
  const response = await app.inject({ method: "GET", url: "/api/v1/profile/" })

  assert.equal(response.statusCode, 401)
  assert.equal(response.json().error, "UNAUTHENTICATED")
  await app.close()
})

test("logout revoga sessão com segurança mesmo sem cookie", async () => {
  const app = await buildApp()
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/logout",
  })

  assert.equal(response.statusCode, 204)
  assert.equal(
    response.headers["set-cookie"]?.toString().includes("fineduca_session="),
    true,
  )
  await app.close()
})

test("cadastro rejeita senha curta antes de acessar o banco", async () => {
  const app = await buildApp()
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: { name: "Pessoa", email: "pessoa@example.com", password: "curta" },
  })

  assert.equal(response.statusCode, 400)
  assert.equal(response.json().error, "VALIDATION_ERROR")
  await app.close()
})

test("rotas financeiras exigem sessão autenticada", async () => {
  const app = await buildApp()
  const response = await app.inject({
    method: "GET",
    url: "/api/v1/finance/transactions",
  })

  assert.equal(response.statusCode, 401)
  assert.equal(response.json().error, "UNAUTHENTICATED")
  await app.close()
})
