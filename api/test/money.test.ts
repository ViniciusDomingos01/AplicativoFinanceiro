import assert from "node:assert/strict"
import test from "node:test"
import {
  availableBalanceCents,
  estimatedBalanceCents,
  sumExpensesByCategory,
  toSafeCurrencyNumber,
} from "../src/money.js"

test("saldo estimado usa o patrimônio inicial e exclui datas anteriores ao início", () => {
  const start = new Date("2026-01-10T00:00:00.000Z")
  const balance = estimatedBalanceCents(100_000n, start, new Date("2026-01-31T00:00:00.000Z"), [
    { amountCents: 50_000n, type: "INCOME", date: new Date("2026-01-09T00:00:00.000Z") },
    { amountCents: 20_000n, type: "INCOME", date: new Date("2026-01-12T00:00:00.000Z") },
    { amountCents: 5_500n, type: "EXPENSE", date: new Date("2026-01-20T00:00:00.000Z") },
    { amountCents: 10_000n, type: "EXPENSE", date: new Date("2026-02-01T00:00:00.000Z") },
  ])
  assert.equal(balance, 114_500n)
})

test("despesas são agrupadas por categoria dentro do período", () => {
  const totals = sumExpensesByCategory(
    [
      { categoryId: "food", amountCents: 1_000n, type: "EXPENSE", date: new Date("2026-03-02T00:00:00Z") },
      { categoryId: "food", amountCents: 200n, type: "INCOME", date: new Date("2026-03-02T00:00:00Z") },
      { categoryId: "food", amountCents: 300n, type: "EXPENSE", date: new Date("2026-04-01T00:00:00Z") },
      { categoryId: "home", amountCents: 500n, type: "EXPENSE", date: new Date("2026-03-10T00:00:00Z") },
    ],
    new Date("2026-03-01T00:00:00Z"),
    new Date("2026-03-31T00:00:00Z"),
  )
  assert.deepEqual([...totals], [["food", 1_000n], ["home", 500n]])
})

test("reserva de meta reduz apenas o saldo disponível, não o patrimônio estimado", () => {
  assert.equal(availableBalanceCents(100_000n, 25_000n), 75_000n)
})

test("centavos fora do intervalo seguro são recusados na borda da API", () => {
  assert.equal(toSafeCurrencyNumber(12_345n), 123.45)
  assert.throws(() => toSafeCurrencyNumber(BigInt(Number.MAX_SAFE_INTEGER) + 1n))
})
