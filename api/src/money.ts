export function sumCents(values: Iterable<bigint>) {
  let total = 0n
  for (const value of values) total += value
  return total
}

export function estimatedBalanceCents(
  initialBalanceCents: bigint,
  startDate: Date,
  asOfDate: Date,
  transactions: Array<{ amountCents: bigint; type: "INCOME" | "EXPENSE"; date: Date }>,
) {
  return transactions.reduce((balance, transaction) => {
    if (transaction.date < startDate || transaction.date > asOfDate) return balance
    return transaction.type === "INCOME"
      ? balance + transaction.amountCents
      : balance - transaction.amountCents
  }, initialBalanceCents)
}

export function toSafeCurrencyNumber(cents: bigint) {
  const asNumber = Number(cents)
  if (!Number.isSafeInteger(asNumber)) {
    throw new RangeError("Valor monetário fora do intervalo suportado pela interface.")
  }
  return asNumber / 100
}

export function sumExpensesByCategory(
  transactions: Array<{
    categoryId: string
    amountCents: bigint
    type: "INCOME" | "EXPENSE"
    date: Date
  }>,
  from: Date,
  through: Date,
) {
  const totals = new Map<string, bigint>()
  for (const transaction of transactions) {
    if (
      transaction.type !== "EXPENSE" ||
      transaction.date < from ||
      transaction.date > through
    ) {
      continue
    }
    totals.set(
      transaction.categoryId,
      (totals.get(transaction.categoryId) ?? 0n) + transaction.amountCents,
    )
  }
  return totals
}

export function availableBalanceCents(
  estimatedBalance: bigint,
  declaredGoalReserve: bigint,
) {
  return estimatedBalance - declaredGoalReserve
}
