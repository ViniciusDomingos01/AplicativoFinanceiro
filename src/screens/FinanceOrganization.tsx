import { useEffect, useRef, useState, type FormEvent } from "react"
import { ArrowLeft, Landmark, Pencil, Plus, Trash2 } from "lucide-react"
import {
  api,
  ApiError,
  fromCents,
  toCents,
  type ApiBudget,
  type ApiFinancialSource,
} from "../api/client"
import type { SpendingCategory } from "../data/mockData"
import {
  Card,
  FINANCE_FIELD_CLASS,
  formatCurrency,
  formatSignedCurrency,
  Modal,
  parseNumericInput,
  ProgressBar,
  Toast,
} from "../components/UI"

interface FinanceOrganizationProps {
  categories: SpendingCategory[]
  sources: ApiFinancialSource[]
  budgets: ApiBudget[]
  onRefresh: () => Promise<unknown>
  onBack: () => void
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export default function FinanceOrganization({
  categories,
  sources,
  budgets: initialBudgets,
  onRefresh,
  onBack,
}: FinanceOrganizationProps) {
  const [month, setMonth] = useState(currentMonth)
  const [budgets, setBudgets] = useState(initialBudgets)
  const [loadingBudgets, setLoadingBudgets] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sourceName, setSourceName] = useState("")
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState("")
  const [limit, setLimit] = useState("")
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [pendingDelete, setPendingDelete] = useState<{
    kind: "source" | "budget"
    id: string
    label: string
  } | null>(null)
  const budgetRequestId = useRef(0)

  const expenseCategories = categories.filter(
    (category) => category.type === "expense",
  )

  async function loadBudgets(requestedMonth = month) {
    const requestId = ++budgetRequestId.current
    setLoadingBudgets(true)
    setError("")
    try {
      const data = await api.get<ApiBudget[]>(
        `/budgets?month=${requestedMonth}`,
      )
      if (requestId === budgetRequestId.current) setBudgets(data)
    } catch (cause) {
      if (requestId === budgetRequestId.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar os orçamentos.",
        )
      }
    } finally {
      if (requestId === budgetRequestId.current) setLoadingBudgets(false)
    }
  }

  useEffect(() => {
    void loadBudgets(month)
  }, [month])

  async function saveSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = sourceName.trim()
    if (!name) return
    setSaving(true)
    setError("")
    try {
      if (editingSourceId)
        await api.patch(`/finance/sources/${editingSourceId}`, { name })
      else await api.post("/finance/sources", { name })
      await onRefresh()
      setSourceName("")
      setEditingSourceId(null)
      setMessage(editingSourceId ? "Origem atualizada." : "Origem cadastrada.")
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível salvar a origem.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = parseNumericInput(limit)
    if (!categoryId || !Number.isFinite(amount) || amount <= 0) {
      setError("Escolha uma categoria e informe um limite maior que zero.")
      return
    }
    setSaving(true)
    setError("")
    try {
      await api.put("/budgets", {
        categoryId,
        month,
        limitCents: toCents(amount),
      })
      await loadBudgets(month)
      await onRefresh()
      setCategoryId("")
      setLimit("")
      setEditingBudgetId(null)
      setMessage("Orçamento atualizado. O limite não altera o patrimônio.")
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível salvar o orçamento.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function removePending() {
    if (!pendingDelete) return
    setSaving(true)
    setError("")
    try {
      if (pendingDelete.kind === "source") {
        await api.delete(`/finance/sources/${pendingDelete.id}`)
        await onRefresh()
        setMessage(
          "Origem excluída. Os registros vinculados ficaram sem origem.",
        )
      } else {
        await api.delete(`/budgets/${pendingDelete.id}`)
        await loadBudgets(month)
        await onRefresh()
        setMessage("Orçamento excluído.")
      }
      setPendingDelete(null)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível excluir o registro.",
      )
    } finally {
      setSaving(false)
    }
  }

  function editBudget(budget: ApiBudget) {
    setEditingBudgetId(budget.id)
    setCategoryId(budget.categoryId)
    setLimit(String(fromCents(budget.limitCents)).replace(".", ","))
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <header className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-5 pb-5 pt-14 text-white">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-white/90 hover:bg-white/10"
          aria-label="Voltar para finanças"
        >
          <ArrowLeft size={18} /> Finanças
        </button>
        <h1 className="font-display text-xl font-bold">Origens e orçamentos</h1>
        <p className="mt-1 text-xs leading-5 text-blue-100">
          Organização informada por você. Nenhum valor é movimentado ou
          sincronizado com instituições.
        </p>
      </header>

      <main className="phone-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-24">
        {message && <Toast message={message} />}
        {error && <Toast message={error} kind="error" />}

        <section aria-labelledby="sources-title">
          <div className="mb-2 flex items-center gap-2 px-1">
            <Landmark size={17} className="text-blue-600" />
            <h2
              id="sources-title"
              className="font-display text-sm font-bold text-slate-900"
            >
              Origens financeiras
            </h2>
          </div>
          <Card className="space-y-3 p-4">
            <p className="text-xs leading-5 text-slate-500">
              Identifique onde você informa que o dinheiro está guardado, como
              uma conta, poupança ou dinheiro em espécie.
            </p>
            <form
              onSubmit={(event) => void saveSource(event)}
              className="flex gap-2"
            >
              <input
                aria-label="Nome da origem financeira"
                required
                maxLength={80}
                value={sourceName}
                onChange={(event) => setSourceName(event.target.value)}
                className={FINANCE_FIELD_CLASS}
                placeholder="Ex.: Conta principal"
              />
              <button
                type="submit"
                disabled={saving}
                className="flex min-w-12 items-center justify-center rounded-2xl bg-blue-600 px-3 text-white disabled:opacity-50"
                aria-label={
                  editingSourceId ? "Salvar origem" : "Adicionar origem"
                }
              >
                {editingSourceId ? "Salvar" : <Plus size={19} />}
              </button>
            </form>
            {editingSourceId && (
              <button
                type="button"
                onClick={() => {
                  setEditingSourceId(null)
                  setSourceName("")
                }}
                className="text-xs font-semibold text-slate-500 underline"
              >
                Cancelar edição
              </button>
            )}
            {sources.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
                Nenhuma origem cadastrada. O vínculo é opcional.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {sources.map((source) => (
                  <li
                    key={source.id}
                    className="flex items-center gap-2 py-2 first:pt-0 last:pb-0"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                      {source.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSourceId(source.id)
                        setSourceName(source.name)
                      }}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                      aria-label={`Editar origem ${source.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingDelete({
                          kind: "source",
                          id: source.id,
                          label: source.name,
                        })
                      }
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      aria-label={`Excluir origem ${source.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <section aria-labelledby="budgets-title">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2
              id="budgets-title"
              className="font-display text-sm font-bold text-slate-900"
            >
              Orçamentos por categoria
            </h2>
            <input
              aria-label="Mês dos orçamentos"
              type="month"
              value={month}
              onChange={(event) => {
                setEditingBudgetId(null)
                setCategoryId("")
                setLimit("")
                setMonth(event.target.value)
              }}
              className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700"
            />
          </div>
          <Card className="space-y-3 p-4">
            <p className="text-xs leading-5 text-slate-500">
              Compare o limite que você definiu com as despesas registradas no
              período. Orçamentos são indicadores, não movimentações.
            </p>
            {expenseCategories.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
                Cadastre uma categoria de despesa antes de definir um orçamento.
              </p>
            ) : (
              <form
                onSubmit={(event) => void saveBudget(event)}
                className="space-y-3"
              >
                <label className="block text-xs font-semibold text-slate-600">
                  Categoria de despesa
                  <select
                    required
                    disabled={Boolean(editingBudgetId)}
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    className={`${FINANCE_FIELD_CLASS} mt-1 disabled:bg-slate-100`}
                  >
                    <option value="">Selecione uma categoria</option>
                    {expenseCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  Limite mensal (R$)
                  <input
                    required
                    inputMode="decimal"
                    value={limit}
                    onChange={(event) => setLimit(event.target.value)}
                    className={`${FINANCE_FIELD_CLASS} mt-1`}
                    placeholder="0,00"
                  />
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {editingBudgetId
                    ? "Atualizar orçamento"
                    : "Definir orçamento"}
                </button>
                {editingBudgetId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBudgetId(null)
                      setCategoryId("")
                      setLimit("")
                    }}
                    className="w-full text-xs font-semibold text-slate-500 underline"
                  >
                    Cancelar edição
                  </button>
                )}
              </form>
            )}
          </Card>

          <div className="mt-3 space-y-3">
            {loadingBudgets ? (
              <p
                role="status"
                className="rounded-2xl bg-white px-4 py-5 text-center text-xs text-slate-500"
              >
                Carregando orçamentos…
              </p>
            ) : budgets.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500">
                Nenhum orçamento definido para este mês.
              </p>
            ) : (
              budgets.map((budget) => (
                <Card key={budget.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-slate-800">
                        {budget.category.name}
                      </h3>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Despesas registradas
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {formatCurrency(fromCents(budget.spentCents))}{" "}
                        <span className="font-normal text-slate-400">
                          de {formatCurrency(fromCents(budget.limitCents))}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0">
                      <button
                        type="button"
                        onClick={() => editBudget(budget)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        aria-label={`Editar orçamento de ${budget.category.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingDelete({
                            kind: "budget",
                            id: budget.id,
                            label: budget.category.name,
                          })
                        }
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        aria-label={`Excluir orçamento de ${budget.category.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <ProgressBar
                    value={fromCents(budget.spentCents)}
                    max={fromCents(budget.limitCents)}
                    color={budget.percentage > 100 ? "#dc2626" : "#2563eb"}
                    className="my-3"
                  />
                  <div className="flex justify-between gap-2 text-[11px]">
                    <span className="text-slate-500">
                      {budget.percentage.toLocaleString("pt-BR", {
                        maximumFractionDigits: 1,
                      })}
                      % utilizado
                    </span>
                    <span
                      className={`font-semibold ${
                        Number(budget.remainingCents) < 0
                          ? "text-red-600"
                          : "text-slate-700"
                      }`}
                    >
                      {Number(budget.remainingCents) < 0
                        ? "Acima do limite "
                        : "Restante "}
                      {formatSignedCurrency(fromCents(budget.remainingCents))}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      </main>

      {pendingDelete && (
        <Modal
          title={
            pendingDelete.kind === "source"
              ? "Excluir origem?"
              : "Excluir orçamento?"
          }
          onClose={() => setPendingDelete(null)}
        >
          <p className="text-sm leading-6 text-slate-600">
            {pendingDelete.kind === "source"
              ? `A origem “${pendingDelete.label}” será removida. As transações vinculadas permanecerão salvas sem origem.`
              : `O orçamento de “${pendingDelete.label}” será removido. As despesas registradas não serão alteradas.`}
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => setPendingDelete(null)}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void removePending()}
              className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? "Excluindo…" : "Excluir"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
