import { useState, type FormEvent } from "react"
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  FolderPlus,
  Landmark,
  Plus,
  Target,
  WalletCards,
} from "lucide-react"
import {
  FINANCE_FIELD_CLASS,
  formatCurrency,
  parseNumericInput,
  Toast,
} from "../components/UI"
import type { Goal, SpendingCategory, Transaction } from "../data/mockData"

export interface FinanceWorkspace {
  balance: number
  initialBalance?: number | null
  trackingStartDate?: string | null
  categories: SpendingCategory[]
  goals: Goal[]
  transactions: Transaction[]
}

export type SetupSection = "balance" | "transaction" | "category" | "goal"

interface FinanceSetupProps {
  workspace: FinanceWorkspace
  initialSection: SetupSection
  onChange: (workspace: FinanceWorkspace) => Promise<void>
  onBack: () => void
}

const sectionOptions: Array<{
  id: SetupSection
  label: string
  icon: typeof Landmark
}> = [
  { id: "balance", label: "Saldo", icon: Landmark },
  { id: "transaction", label: "Transação", icon: WalletCards },
  { id: "category", label: "Categoria", icon: FolderPlus },
  { id: "goal", label: "Meta", icon: Target },
]

const categoryColors = ["#2563eb", "#7c3aed", "#0891b2", "#d97706", "#16a34a"]

function recalculatePercentages(categories: SpendingCategory[]) {
  const total = categories.reduce((sum, category) => sum + category.amount, 0)
  return categories.map((category) => ({
    ...category,
    percentage: total > 0 ? Math.round((category.amount / total) * 100) : 0,
  }))
}

export default function FinanceSetup({
  workspace,
  initialSection,
  onChange,
  onBack,
}: FinanceSetupProps) {
  const [section, setSection] = useState<SetupSection>(initialSection)
  const [balance, setBalance] = useState(String(workspace.initialBalance ?? 0))
  const [trackingStartDate, setTrackingStartDate] = useState(
    workspace.trackingStartDate ?? new Date().toISOString().slice(0, 10),
  )
  const [categoryName, setCategoryName] = useState("")
  const [categoryType, setCategoryType] =
    useState<Transaction["type"]>("expense")
  const [goalForm, setGoalForm] = useState({
    title: "",
    target: "",
    current: "",
    deadline: "",
  })
  const [transactionForm, setTransactionForm] = useState({
    title: "",
    amount: "",
    type: "expense" as Transaction["type"],
    category:
      workspace.categories.find((item) => item.type === "expense")?.name ?? "",
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: "PIX",
    note: "",
  })
  const [message, setMessage] = useState("")
  const [messageKind, setMessageKind] = useState<"success" | "error">("success")

  function notify(text: string, kind: "success" | "error" = "success") {
    setMessage(text)
    setMessageKind(kind)
    window.setTimeout(() => setMessage(""), 2200)
  }

  async function persist(next: FinanceWorkspace, successMessage: string) {
    try {
      await onChange(next)
      notify(successMessage)
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as alterações.",
        "error",
      )
    }
  }

  function saveBalance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = parseNumericInput(balance)
    if (!Number.isFinite(value)) {
      notify("Informe um saldo válido.", "error")
      return
    }
    if (!trackingStartDate) {
      notify("Informe a data de início do acompanhamento.", "error")
      return
    }
    void persist(
      {
        ...workspace,
        initialBalance: value,
        trackingStartDate,
      },
      "Patrimônio inicial atualizado",
    )
  }

  function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) return
    if (
      workspace.categories.some(
        (category) =>
          category.name.toLocaleLowerCase() === name.toLocaleLowerCase() &&
          category.type === categoryType,
      )
    ) {
      notify("Essa categoria já existe.", "error")
      return
    }
    const category: SpendingCategory = {
      name,
      amount: 0,
      percentage: 0,
      color:
        categoryColors[workspace.categories.length % categoryColors.length],
      icon: "•",
      type: categoryType,
    }
    void persist(
      { ...workspace, categories: [...workspace.categories, category] },
      "Categoria adicionada",
    )
    setCategoryName("")
    setTransactionForm((current) => ({ ...current, category: name }))
  }

  function addGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const target = parseNumericInput(goalForm.target)
    const current = goalForm.current ? parseNumericInput(goalForm.current) : 0
    if (
      !goalForm.title.trim() ||
      !Number.isFinite(target) ||
      target <= 0 ||
      !Number.isFinite(current) ||
      current < 0
    ) {
      notify("Informe um nome e valores válidos para a meta.", "error")
      return
    }
    const goal: Goal = {
      id: crypto.randomUUID(),
      title: goalForm.title.trim(),
      icon: "●",
      color: categoryColors[workspace.goals.length % categoryColors.length],
      current,
      target,
      deadline: goalForm.deadline || "Sem prazo",
    }
    void persist(
      { ...workspace, goals: [...workspace.goals, goal] },
      "Meta criada",
    )
    setGoalForm({ title: "", target: "", current: "", deadline: "" })
  }

  function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = parseNumericInput(transactionForm.amount)
    if (
      !transactionForm.title.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !transactionForm.category ||
      !transactionForm.date
    ) {
      notify(
        "Preencha descrição, valor maior que zero, categoria e data.",
        "error",
      )
      return
    }

    const category = workspace.categories.find(
      (item) => item.name === transactionForm.category,
    )
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      title: transactionForm.title.trim(),
      amount,
      type: transactionForm.type,
      category: transactionForm.category,
      categoryColor: category?.color ?? "#2563eb",
      date: transactionForm.date,
      paymentMethod: transactionForm.paymentMethod,
      note: transactionForm.note.trim() || undefined,
      icon: transactionForm.type === "income" ? "↑" : "↓",
    }
    const categories =
      transaction.type === "expense"
        ? recalculatePercentages(
            workspace.categories.map((item) =>
              item.name === transaction.category
                ? { ...item, amount: item.amount + amount }
                : item,
            ),
          )
        : workspace.categories

    void persist(
      {
        ...workspace,
        balance:
          workspace.balance +
          (transaction.type === "income" ? amount : -amount),
        categories,
        transactions: [transaction, ...workspace.transactions],
      },
      "Transação adicionada",
    )
    setTransactionForm((current) => ({
      ...current,
      title: "",
      amount: "",
      note: "",
    }))
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-5 pt-14 pb-6 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 text-white">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"
            aria-label="Voltar para finanças"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-blue-100 text-xs font-medium">
              Organize do seu jeito
            </p>
            <h2 className="font-display text-xl font-bold">
              Cadastrar finanças
            </h2>
          </div>
        </div>
        <div className="flex items-end justify-between rounded-2xl bg-white/10 p-4">
          <div>
            <p className="text-blue-100 text-[10px] font-medium">Saldo atual</p>
            <p className="font-mono-data text-xl font-bold mt-1">
              {formatCurrency(workspace.balance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-[10px]">Registros</p>
            <p className="text-sm font-bold">{workspace.transactions.length}</p>
          </div>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Tipo de cadastro financeiro"
        className="grid grid-cols-4 gap-1.5 px-4 py-3 bg-white border-b border-slate-100"
      >
        {sectionOptions.map(({ id, label, icon: Icon }) => {
          const active = section === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              onClick={() => setSection(id)}
              aria-selected={active}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[9px] font-semibold transition ${
                active ? "bg-blue-50 text-blue-700" : "text-slate-400"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          )
        })}
      </div>

      <div className="phone-scroll flex-1 overflow-y-auto px-4 py-5">
        {message && (
          <div className="mb-4">
            <Toast message={message} kind={messageKind} />
          </div>
        )}

        {section === "balance" && (
          <form
            onSubmit={saveBalance}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Landmark size={19} />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Informe seu saldo
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Informe o patrimônio que você tinha na data em que começou a
              acompanhar suas finanças.
            </p>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                Patrimônio inicial (R$)
              </span>
              <input
                aria-label="Patrimônio inicial em reais"
                required
                inputMode="decimal"
                value={balance}
                onChange={(event) => setBalance(event.target.value)}
                className={FINANCE_FIELD_CLASS}
                placeholder="0,00"
              />
            </label>
            <label className="mt-4 block">
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                Início do acompanhamento
              </span>
              <input
                aria-label="Data de início do acompanhamento"
                required
                type="date"
                value={trackingStartDate}
                onChange={(event) => setTrackingStartDate(event.target.value)}
                className={FINANCE_FIELD_CLASS}
              />
            </label>
            <p className="mt-3 text-[11px] leading-5 text-slate-400">
              O saldo será estimado com este valor e as movimentações
              registradas a partir dessa data. Não é um saldo bancário
              sincronizado.
            </p>
            <button
              type="submit"
              className="w-full mt-5 py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-bold"
            >
              Salvar saldo
            </button>
          </form>
        )}

        {section === "category" && (
          <div className="space-y-4">
            <form
              onSubmit={addCategory}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4"
            >
              <h3 className="font-display text-base font-bold text-slate-900">
                Nova categoria
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Crie grupos para entender melhor seus gastos.
              </p>
              <select
                aria-label="Tipo da categoria"
                value={categoryType}
                onChange={(event) =>
                  setCategoryType(event.target.value as Transaction["type"])
                }
                className={`${FINANCE_FIELD_CLASS} mb-3`}
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
              <input
                aria-label="Nome da categoria"
                required
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                className={FINANCE_FIELD_CLASS}
                placeholder="Ex.: Cursos e livros"
              />
              <button
                type="submit"
                className="w-full mt-4 py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Adicionar categoria
              </button>
            </form>
            <div className="bg-white rounded-3xl border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-700 mb-3">
                Suas categorias
              </p>
              <div className="flex flex-wrap gap-2">
                {workspace.categories.map((category) => (
                  <span
                    key={`${category.type}-${category.name}`}
                    className="rounded-full bg-slate-50 border border-slate-100 px-3 py-1.5 text-[10px] font-medium text-slate-600"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === "goal" && (
          <form
            onSubmit={addGoal}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4"
          >
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">
                Nova meta financeira
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Defina um objetivo claro e acompanhe seu avanço.
              </p>
            </div>
            <input
              aria-label="Nome da meta"
              required
              value={goalForm.title}
              onChange={(event) =>
                setGoalForm({ ...goalForm, title: event.target.value })
              }
              className={FINANCE_FIELD_CLASS}
              placeholder="Nome da meta"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                aria-label="Valor objetivo da meta em reais"
                required
                inputMode="decimal"
                value={goalForm.target}
                onChange={(event) =>
                  setGoalForm({ ...goalForm, target: event.target.value })
                }
                className={FINANCE_FIELD_CLASS}
                placeholder="Valor objetivo"
              />
              <input
                aria-label="Valor já guardado para a meta em reais"
                inputMode="decimal"
                value={goalForm.current}
                onChange={(event) =>
                  setGoalForm({ ...goalForm, current: event.target.value })
                }
                className={FINANCE_FIELD_CLASS}
                placeholder="Já guardado"
              />
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                Prazo
              </span>
              <input
                type="month"
                value={goalForm.deadline}
                onChange={(event) =>
                  setGoalForm({ ...goalForm, deadline: event.target.value })
                }
                className={FINANCE_FIELD_CLASS}
              />
            </label>
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-violet-600 text-white text-sm font-bold"
            >
              Criar meta
            </button>
          </form>
        )}

        {section === "transaction" && (
          <form
            onSubmit={addTransaction}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4"
          >
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">
                Nova transação
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Registre uma receita ou despesa informada por você.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["expense", "income"] as const).map((type) => {
                const selected = transactionForm.type === type
                const Icon = type === "income" ? ArrowUpRight : ArrowDownLeft
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setTransactionForm({
                        ...transactionForm,
                        type,
                        category:
                          workspace.categories.find(
                            (item) => item.type === type,
                          )?.name ?? "",
                      })
                    }
                    className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-bold ${
                      selected
                        ? type === "income"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-red-400 bg-red-50 text-red-600"
                        : "border-slate-100 text-slate-400"
                    }`}
                  >
                    <Icon size={15} />
                    {type === "income" ? "Entrada" : "Saída"}
                  </button>
                )
              })}
            </div>
            <input
              aria-label="Descrição da transação"
              required
              value={transactionForm.title}
              onChange={(event) =>
                setTransactionForm({
                  ...transactionForm,
                  title: event.target.value,
                })
              }
              className={FINANCE_FIELD_CLASS}
              placeholder="Descrição"
            />
            <input
              aria-label="Valor da transação em reais"
              required
              inputMode="decimal"
              value={transactionForm.amount}
              onChange={(event) =>
                setTransactionForm({
                  ...transactionForm,
                  amount: event.target.value,
                })
              }
              className={FINANCE_FIELD_CLASS}
              placeholder="Valor"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                aria-label="Categoria da transação"
                required
                value={transactionForm.category}
                onChange={(event) =>
                  setTransactionForm({
                    ...transactionForm,
                    category: event.target.value,
                  })
                }
                className={FINANCE_FIELD_CLASS}
              >
                {workspace.categories
                  .filter(
                    (category) =>
                      !category.type || category.type === transactionForm.type,
                  )
                  .map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
              </select>
              <input
                aria-label="Data da transação"
                required
                type="date"
                value={transactionForm.date}
                onChange={(event) =>
                  setTransactionForm({
                    ...transactionForm,
                    date: event.target.value,
                  })
                }
                className={FINANCE_FIELD_CLASS}
              />
            </div>
            <select
              aria-label="Forma de pagamento"
              value={transactionForm.paymentMethod}
              onChange={(event) =>
                setTransactionForm({
                  ...transactionForm,
                  paymentMethod: event.target.value,
                })
              }
              className={FINANCE_FIELD_CLASS}
            >
              <option>PIX</option>
              <option>Cartão de Crédito</option>
              <option>Cartão de Débito</option>
              <option>Dinheiro</option>
              <option>Transferência</option>
              <option>Boleto</option>
            </select>
            <textarea
              aria-label="Observação da transação"
              value={transactionForm.note}
              onChange={(event) =>
                setTransactionForm({
                  ...transactionForm,
                  note: event.target.value,
                })
              }
              className={`${FINANCE_FIELD_CLASS} min-h-20 resize-none`}
              placeholder="Observação opcional"
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-bold"
            >
              Adicionar transação
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
