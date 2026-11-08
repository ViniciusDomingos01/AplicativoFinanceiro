import { useState, type FormEvent } from "react"
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  FolderPlus,
  Landmark,
  Plus,
  Target,
  WalletCards,
} from "lucide-react"
import { formatCurrency } from "../components/UI"
import type { Goal, SpendingCategory, Transaction } from "../data/mockData"

export interface FinanceWorkspace {
  balance: number
  categories: SpendingCategory[]
  goals: Goal[]
  transactions: Transaction[]
}

export type SetupSection = "balance" | "transaction" | "category" | "goal"

interface FinanceSetupProps {
  workspace: FinanceWorkspace
  initialSection: SetupSection
  onChange: (workspace: FinanceWorkspace) => void
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
  const [balance, setBalance] = useState(String(workspace.balance))
  const [categoryName, setCategoryName] = useState("")
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
    category: workspace.categories[0]?.name ?? "",
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: "PIX",
    note: "",
  })
  const [message, setMessage] = useState("")

  const fieldClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

  function notify(text: string) {
    setMessage(text)
    window.setTimeout(() => setMessage(""), 2200)
  }

  function saveBalance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = Number(balance.replace(",", "."))
    if (!Number.isFinite(value)) return
    onChange({ ...workspace, balance: value })
    notify("Saldo atualizado com sucesso")
  }

  function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) return
    const category: SpendingCategory = {
      name,
      amount: 0,
      percentage: 0,
      color: categoryColors[workspace.categories.length % categoryColors.length],
      icon: "•",
    }
    onChange({ ...workspace, categories: [...workspace.categories, category] })
    setCategoryName("")
    setTransactionForm((current) => ({ ...current, category: name }))
    notify("Categoria adicionada")
  }

  function addGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const target = Number(goalForm.target.replace(",", "."))
    const current = Number(goalForm.current.replace(",", ".")) || 0
    if (!goalForm.title.trim() || !target) return
    const goal: Goal = {
      id: crypto.randomUUID(),
      title: goalForm.title.trim(),
      icon: "●",
      color: categoryColors[workspace.goals.length % categoryColors.length],
      current,
      target,
      deadline: goalForm.deadline || "Sem prazo",
    }
    onChange({ ...workspace, goals: [...workspace.goals, goal] })
    setGoalForm({ title: "", target: "", current: "", deadline: "" })
    notify("Meta criada")
  }

  function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(transactionForm.amount.replace(",", "."))
    if (!transactionForm.title.trim() || !amount || !transactionForm.category) return

    const category = workspace.categories.find(
      (item) => item.name === transactionForm.category
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
                : item
            )
          )
        : workspace.categories

    onChange({
      ...workspace,
      balance:
        workspace.balance + (transaction.type === "income" ? amount : -amount),
      categories,
      transactions: [transaction, ...workspace.transactions],
    })
    setTransactionForm((current) => ({
      ...current,
      title: "",
      amount: "",
      note: "",
    }))
    notify("Transação adicionada")
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
            <p className="text-blue-100 text-xs font-medium">Organize do seu jeito</p>
            <h2 className="font-display text-xl font-bold">Cadastrar finanças</h2>
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

      <div className="grid grid-cols-4 gap-1.5 px-4 py-3 bg-white border-b border-slate-100">
        {sectionOptions.map(({ id, label, icon: Icon }) => {
          const active = section === id
          return (
            <button
              key={id}
              onClick={() => setSection(id)}
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
          <div className="flex items-center gap-2 rounded-2xl bg-green-50 border border-green-100 px-3.5 py-3 mb-4 text-xs font-semibold text-green-700">
            <Check size={15} />
            {message}
          </div>
        )}

        {section === "balance" && (
          <form onSubmit={saveBalance} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Landmark size={19} />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">Informe seu saldo</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Digite o total disponível hoje nas suas contas.
            </p>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">Saldo total</span>
              <input
                required
                inputMode="decimal"
                value={balance}
                onChange={(event) => setBalance(event.target.value)}
                className={fieldClass}
                placeholder="0,00"
              />
            </label>
            <button className="w-full mt-5 py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-bold">
              Salvar saldo
            </button>
          </form>
        )}

        {section === "category" && (
          <div className="space-y-4">
            <form onSubmit={addCategory} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
              <h3 className="font-display text-base font-bold text-slate-900">Nova categoria</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Crie grupos para entender melhor seus gastos.
              </p>
              <input
                required
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                className={fieldClass}
                placeholder="Ex.: Cursos e livros"
              />
              <button className="w-full mt-4 py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2">
                <Plus size={16} />
                Adicionar categoria
              </button>
            </form>
            <div className="bg-white rounded-3xl border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-700 mb-3">Suas categorias</p>
              <div className="flex flex-wrap gap-2">
                {workspace.categories.map((category) => (
                  <span
                    key={category.name}
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
          <form onSubmit={addGoal} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">Nova meta financeira</h3>
              <p className="text-xs text-slate-400 mt-1">Defina um objetivo claro e acompanhe seu avanço.</p>
            </div>
            <input
              required
              value={goalForm.title}
              onChange={(event) => setGoalForm({ ...goalForm, title: event.target.value })}
              className={fieldClass}
              placeholder="Nome da meta"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                inputMode="decimal"
                value={goalForm.target}
                onChange={(event) => setGoalForm({ ...goalForm, target: event.target.value })}
                className={fieldClass}
                placeholder="Valor objetivo"
              />
              <input
                inputMode="decimal"
                value={goalForm.current}
                onChange={(event) => setGoalForm({ ...goalForm, current: event.target.value })}
                className={fieldClass}
                placeholder="Já guardado"
              />
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">Prazo</span>
              <input
                type="month"
                value={goalForm.deadline}
                onChange={(event) => setGoalForm({ ...goalForm, deadline: event.target.value })}
                className={fieldClass}
              />
            </label>
            <button className="w-full py-3.5 rounded-2xl bg-violet-600 text-white text-sm font-bold">
              Criar meta
            </button>
          </form>
        )}

        {section === "transaction" && (
          <form onSubmit={addTransaction} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">Nova transação</h3>
              <p className="text-xs text-slate-400 mt-1">Registre uma entrada ou saída do seu saldo.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["expense", "income"] as const).map((type) => {
                const selected = transactionForm.type === type
                const Icon = type === "income" ? ArrowUpRight : ArrowDownLeft
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type })}
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
              required
              value={transactionForm.title}
              onChange={(event) => setTransactionForm({ ...transactionForm, title: event.target.value })}
              className={fieldClass}
              placeholder="Descrição"
            />
            <input
              required
              inputMode="decimal"
              value={transactionForm.amount}
              onChange={(event) => setTransactionForm({ ...transactionForm, amount: event.target.value })}
              className={fieldClass}
              placeholder="Valor"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                required
                value={transactionForm.category}
                onChange={(event) => setTransactionForm({ ...transactionForm, category: event.target.value })}
                className={fieldClass}
              >
                {workspace.categories.map((category) => (
                  <option key={category.name}>{category.name}</option>
                ))}
              </select>
              <input
                required
                type="date"
                value={transactionForm.date}
                onChange={(event) => setTransactionForm({ ...transactionForm, date: event.target.value })}
                className={fieldClass}
              />
            </div>
            <select
              value={transactionForm.paymentMethod}
              onChange={(event) => setTransactionForm({ ...transactionForm, paymentMethod: event.target.value })}
              className={fieldClass}
            >
              <option>PIX</option>
              <option>Cartão de Crédito</option>
              <option>Cartão de Débito</option>
              <option>Dinheiro</option>
              <option>Transferência</option>
              <option>Boleto</option>
            </select>
            <textarea
              value={transactionForm.note}
              onChange={(event) => setTransactionForm({ ...transactionForm, note: event.target.value })}
              className={`${fieldClass} min-h-20 resize-none`}
              placeholder="Observação opcional"
            />
            <button className="w-full py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-bold">
              Adicionar transação
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
