export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  })

  if (response.status === 204) return undefined as T
  const body = (await response.json().catch(() => null)) as {
    error?: string
    message?: string
  } | T | null

  if (!response.ok) {
    const errorBody = body as { error?: string; message?: string } | null
    throw new ApiError(
      response.status,
      errorBody?.error ?? "REQUEST_FAILED",
      errorBody?.message ?? "Não foi possível concluir a solicitação.",
    )
  }

  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}

export interface ApiProfile {
  id: string
  email: string
  profile: {
    id: string
    name: string
    createdAt: string
    phone: string | null
    monthlyIncomeCents: string | null
    financialGoal: string | null
  } | null
  preferences: { notificationsEnabled: boolean } | null
  baseline: { initialBalanceCents: string; trackingStartDate: string } | null
}

export interface ApiTransaction {
  id: string
  userId: string
  categoryId: string
  sourceId: string | null
  type: "INCOME" | "EXPENSE"
  amountCents: string
  description: string
  date: string
  paymentMethod: string | null
  note: string | null
  category: {
    id: string
    name: string
    type: "INCOME" | "EXPENSE"
    color: string | null
    icon: string | null
  }
  source: { id: string; name: string } | null
}

export interface ApiCategory {
  id: string
  name: string
  type: "INCOME" | "EXPENSE"
  color: string | null
  icon: string | null
}

export interface ApiGoal {
  id: string
  title: string
  targetCents: string
  currentReservedCents: string
  deadline: string | null
}

export interface ApiSummary {
  period: { from: string; through: string }
  initialBalanceCents: string
  estimatedBalanceCents: string
  reservedForGoalsCents: string
  availableBalanceCents: string
  incomeCents: string
  expensesCents: string
  netCents: string
  savingsRatePercent: number | null
  spendingCategories: Array<{
    id: string
    name: string
    amountCents: string
    percentage: number
    color: string | null
    icon: string | null
  }>
  monthlyData: Array<{
    month: string
    incomeCents: string
    expensesCents: string
  }>
}

export function fromCents(value: string | bigint | null | undefined) {
  if (value === null || value === undefined) return 0
  const cents = Number(value)
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError(
      "O valor excede o limite monetário que esta interface consegue exibir.",
    )
  }
  return cents / 100
}

export function toCents(value: number) {
  if (!Number.isFinite(value)) throw new TypeError("Valor monetário inválido.")
  return BigInt(Math.round(value * 100)).toString()
}
