/**
 * Finances.tsx — Tela de gerenciamento financeiro completo
 *
 * Exibe um resumo do saldo, receitas, despesas e investimentos do mês,
 * com gráfico de barras comparativo, categorias de gasto e lista de
 * transações recentes agrupadas por data.
 *
 * Estrutura visual:
 * 1. Header com gradiente azul (saldo + mini cards de resumo)
 * 2. Filtro de período
 * 3. Gráfico de barras receitas × despesas
 * 4. Categorias de gastos com barras de progresso
 * 5. Lista de transações agrupadas por data (com navegação para detalhe)
 * 6. FAB (botão flutuante) para adicionar nova transação
 *
 * Atenção de layout:
 * - O FAB fica FORA do div scrollável para não desaparecer ao rolar.
 *   O wrapper usa `relative` e o FAB usa `absolute bottom-20 right-4`,
 *   ficando sempre visível acima da lista.
 * - O conteúdo scrollável tem espaço extra para o FAB e o bottom nav.
 */

import { useEffect, useState } from "react"
import {
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Settings2,
} from "lucide-react"
import { MonthlyBarChart } from "../components/Charts"
import {
  Card,
  ProgressBar,
  formatCurrency,
  SectionHeader,
  formatSignedCurrency,
} from "../components/UI"
import type { Transaction } from "../data/mockData"
import type { FinanceWorkspace } from "./FinanceSetup"
import type { ApiSummary } from "../api/client"
import { fromCents } from "../api/client"

/** Opções de filtro de período exibidas como chips selecionáveis */
import type { NavigateToScreen } from "../app/routes"

const periods = ["7d", "30d", "3m", "6m", "1a"]
const periodDays: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "1a": 365,
}
interface FinancesProps {
  /** Função de navegação global recebida do App.tsx */
  navigate: NavigateToScreen
  workspace: FinanceWorkspace
  initialSummary: ApiSummary | null
  onPeriodChange: (from: string, through: string) => Promise<ApiSummary>
}

export default function Finances({
  navigate,
  workspace,
  initialSummary,
  onPeriodChange,
}: FinancesProps) {
  const { transactions, balance } = workspace
  const [activePeriod, setActivePeriod] = useState("30d")
  const [summary, setSummary] = useState(initialSummary)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState("")
  const [showAllTransactions, setShowAllTransactions] = useState(false)

  const periodEnd = new Date(
    `${new Date().toISOString().slice(0, 10)}T12:00:00`,
  )
  const periodStart = new Date(periodEnd)
  periodStart.setDate(periodStart.getDate() - periodDays[activePeriod] + 1)
  const filteredTransactions = transactions.filter((transaction) => {
    const date = new Date(`${transaction.date}T12:00:00`)
    return date >= periodStart && date <= periodEnd
  })

  useEffect(() => {
    const through = new Date().toISOString().slice(0, 10)
    const from = new Date(`${through}T00:00:00.000Z`)
    from.setUTCDate(from.getUTCDate() - periodDays[activePeriod] + 1)
    setLoadingSummary(true)
    setSummaryError("")
    onPeriodChange(from.toISOString().slice(0, 10), through)
      .then(setSummary)
      .catch((error: unknown) =>
        setSummaryError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o período.",
        ),
      )
      .finally(() => setLoadingSummary(false))
  }, [activePeriod, onPeriodChange])

  // Separa transações por tipo para exibição na listagem
  const income = filteredTransactions.filter((t) => t.type === "income")
  const expenses = filteredTransactions.filter((t) => t.type === "expense")
  const transactionCategories = expenses.reduce<Array<{
    name: string
    amount: number
    percentage: number
    color: string
    icon: string
  }>>((result, transaction) => {
    const category = result.find((item) => item.name === transaction.category)
    if (category) {
      category.amount += transaction.amount
    } else {
      result.push({
        name: transaction.category,
        amount: transaction.amount,
        percentage: 0,
        color: transaction.categoryColor,
        icon: transaction.icon,
      })
    }
    return result
  }, [])
  const transactionExpenseTotal = transactionCategories.reduce(
    (sum, item) => sum + item.amount,
    0,
  )
  transactionCategories.forEach((item) => {
    item.percentage =
      transactionExpenseTotal > 0
        ? Math.round((item.amount / transactionExpenseTotal) * 100)
        : 0
  })
  const filteredCategories = summary
    ? summary.spendingCategories.map((item) => ({
        name: item.name,
        amount: fromCents(item.amountCents),
        percentage: item.percentage,
        color: item.color ?? "#64748b",
        icon: item.icon ?? "•",
      }))
    : transactionCategories

  /**
   * Agrupa transações por data para renderizar cabeçalhos de dia.
   * Resultado: { "2025-07-01": [tx1, tx2], "2025-07-03": [tx3] }
   */
  const groupedTransactions =
    filteredTransactions.reduce<Record<string, Transaction[]>>((acc, t) => {
      if (!acc[t.date]) acc[t.date] = []
      acc[t.date].push(t)
      return acc
    }, {})

  // Ordena as datas em ordem decrescente (mais recente primeiro)
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) =>
    b.localeCompare(a),
  )
  const chartData =
    summary?.monthlyData.map((item) => ({
      month: item.month,
      income: fromCents(item.incomeCents),
      expenses: fromCents(item.expensesCents),
    })) ?? []
  const displayedIncome = summary
    ? fromCents(summary.incomeCents)
    : income.reduce((sum, item) => sum + item.amount, 0)
  const displayedExpenses = summary
    ? fromCents(summary.expensesCents)
    : expenses.reduce((sum, item) => sum + item.amount, 0)
  const dateLabel = periodEnd.toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  })

  return (
    /*
     * Wrapper com `relative` — necessário para posicionar o FAB
     * absolutamente em relação a este componente (não ao frame do celular).
     */
    <div className="relative flex flex-col flex-1 overflow-hidden">
      {/* ── Área de conteúdo com scroll interno ── */}
      <div className="phone-scroll flex-1 overflow-y-auto bg-slate-50 pb-40">
        {/* ── Header com gradiente azul ── */}
        <div
          className="px-5 pt-14 pb-6"
          style={{
            background:
              "linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #4f46e5 100%)",
          }}
        >
          {/* Título da tela + mês de referência */}
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-white text-xl font-bold"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Finanças
            </h2>
            <span className="text-blue-200 text-xs font-medium">
              Dados de {dateLabel}
            </span>
          </div>

          {/* Patrimônio estimado informado pelo usuário */}
          <div className="mb-5">
            <p className="text-blue-200 text-xs mb-1">Patrimônio estimado</p>
            <p
              className="text-white text-3xl font-bold"
              style={{ fontFamily: "DM Mono, monospace" }}
            >
              {formatCurrency(balance)}
            </p>
            {summary && (
              <p className="mt-1 text-[10px] leading-4 text-blue-100/80">
                Livre estimado{" "}
                {formatSignedCurrency(fromCents(summary.availableBalanceCents))}{" "}
                · reservado para metas{" "}
                {formatCurrency(fromCents(summary.reservedForGoalsCents))}. Não
                sincronizado com bancos.
              </p>
            )}
          </div>

          {/* Indicadores do período, calculados pela API */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: "Receitas",
                value: displayedIncome,
                color: "#4ade80",
              },
              {
                label: "Despesas",
                value: displayedExpenses,
                color: "#fca5a5",
              },
              {
                label: "Livre estimado",
                value: fromCents(summary?.availableBalanceCents),
                color: "#c4b5fd",
              },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-2.5">
                <p className="text-white/60 text-[9px] font-medium">
                  {s.label}
                </p>
                <p
                  className="font-bold text-xs mt-0.5"
                  style={{ color: s.color, fontFamily: "DM Mono, monospace" }}
                >
                  {s.label === "Livre estimado"
                    ? formatSignedCurrency(s.value)
                    : formatCurrency(s.value)}
                </p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate("financeOrganization")}
            className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Settings2 size={15} aria-hidden="true" />
            Gerenciar origens e orçamentos
          </button>
          {loadingSummary && (
            <p role="status" className="mt-2 text-[10px] text-white/70">
              Atualizando período…
            </p>
          )}
          {summaryError && (
            <p role="alert" className="mt-2 text-[10px] text-red-100">
              {summaryError}
            </p>
          )}
        </div>

        {/* ── Conteúdo principal ── */}
        <div className="px-4 pt-4 space-y-4">
          {/* Filtro de período — chips horizontais */}
          <div className="flex gap-2">
            {periods.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setActivePeriod(p)}
                aria-pressed={activePeriod === p}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activePeriod === p
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-500 border border-slate-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Gráfico de barras: receitas × despesas por mês */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-bold text-slate-900"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Receitas vs Despesas
              </h3>
            </div>
            <MonthlyBarChart data={chartData} />
          </Card>

          {/* Categorias de gasto com barra de progresso proporcional */}
          <Card className="p-4">
            <SectionHeader title="Categorias de gasto" />
            <div className="space-y-3">
              {filteredCategories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cat.icon}</span>
                      <span className="text-xs text-slate-700 font-medium">
                        {cat.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-700 font-mono-data">
                        {formatCurrency(cat.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                  {/* Barra proporcional: value = porcentagem da categoria, max = 100 */}
                  <ProgressBar
                    value={cat.percentage}
                    max={100}
                    color={cat.color}
                    height={5}
                  />
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                  Sem despesas registradas neste período.
                </p>
              )}
            </div>
          </Card>

          {/* Lista de transações agrupadas por data */}
          <div>
            <SectionHeader
              title="Transações recentes"
              action={showAllTransactions ? "Mostrar menos" : "Ver todas"}
              onAction={() => setShowAllTransactions((value) => !value)}
            />
            <div className="space-y-2.5">
              {sortedDates
                .slice(0, showAllTransactions ? undefined : 4)
                .map((date) => (
                  <div key={date}>
                    {/* Cabeçalho do grupo de data */}
                    <p className="text-[10px] text-slate-400 font-medium mb-1.5 uppercase tracking-wide px-1">
                      {new Date(date + "T12:00:00").toLocaleDateString(
                        "pt-BR",
                        {
                          weekday: "long",
                          day: "2-digit",
                          month: "short",
                        },
                      )}
                    </p>

                    {/* Itens do grupo */}
                    <div className="space-y-1.5">
                      {groupedTransactions[date].map((t) => (
                        <Card
                          key={t.id}
                          className="px-4 py-3 flex items-center gap-3"
                          onClick={() => navigate("transaction", t)} // abre tela de detalhe
                        >
                          {/* Ícone da categoria com cor de fundo suave */}
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: t.categoryColor + "18" }}
                          >
                            {t.icon}
                          </div>

                          {/* Nome e categoria */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {t.title}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {t.category}
                            </p>
                          </div>

                          {/* Valor com cor diferente para receita (verde) e despesa (cinza) */}
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-sm font-bold font-mono-data ${
                                t.type === "income"
                                  ? "text-green-600"
                                  : "text-slate-700"
                              }`}
                            >
                              {t.type === "income" ? "+" : "-"}
                              {formatCurrency(t.amount)}
                            </span>
                            <ArrowUpRight
                              size={12}
                              className="text-slate-300"
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              {sortedDates.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500">
                  Nenhuma transação encontrada neste período.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/*
       * FAB (Floating Action Button) para adicionar nova transação.
       *
       * IMPORTANTE: Fica FORA do div scrollável (phone-scroll), posicionado
       * com `absolute` em relação ao wrapper `relative` deste componente.
       * Isso garante que o botão permaneça fixo visualmente mesmo ao rolar
       * a lista de transações para cima/baixo.
       *
       * `bottom-24` mantém o botão acima do bottom nav.
       */}
      <button
        onClick={() => navigate("financeSetup", "transaction")}
        className="absolute bottom-24 right-4 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl active:scale-95 transition-all z-40"
        style={{
          background: "linear-gradient(135deg, #2563eb, #4f46e5)",
          boxShadow: "0 4px 20px #2563eb55",
        }}
        aria-label="Adicionar nova transação"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
