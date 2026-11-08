/**
 * Home.tsx — Dashboard principal do FinEduca
 *
 * Tela inicial após o onboarding. Resume a situação financeira do usuário
 * e oferece acesso rápido às principais funcionalidades do app.
 *
 * Seções desta tela (de cima para baixo):
 * 1. Header com gradiente verde — saudação, saldo total e gráfico de evolução
 * 2. Cards de resumo — receitas, despesas e investimentos do mês
 * 3. Categorias de gasto — top 3 categorias com barra de progresso
 * 4. Meta principal — progresso da reserva de emergência
 * 5. "Continue aprendendo" — curso em andamento com progresso
 * 6. Botão de nova transação (CTA verde)
 *
 * Esta tela usa `pb-24` para garantir que o conteúdo não fique escondido
 * atrás do bottom nav (altura ~64px + margem de segurança).
 */

import {
  Bell,
  Plus,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Target,
  BookOpen,
} from "lucide-react"
import { courses } from "../data/mockData"
import { BalanceAreaChart } from "../components/Charts"
import {
  Card,
  ProgressBar,
  formatCurrency,
  formatSignedCurrency,
} from "../components/UI"
import type { UserProfile } from "../data/mockData"
import type { FinanceWorkspace } from "./FinanceSetup"
import type { ApiSummary } from "../api/client"
import { fromCents } from "../api/client"

import type { NavigateToScreen } from "../app/routes"

interface HomeProps {
  /** Função de navegação global recebida do App.tsx */
  navigate: NavigateToScreen
  user: UserProfile
  workspace: FinanceWorkspace
  courseProgress: Record<string, number>
  summary: ApiSummary | null
}

export default function Home({
  navigate,
  user,
  workspace,
  courseProgress,
  summary,
}: HomeProps) {
  const { balance, categories, goals, transactions } = workspace
  const income = summary
    ? fromCents(summary.incomeCents)
    : transactions
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0)
  const expenses = summary
    ? fromCents(summary.expensesCents)
    : transactions
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0)
  const chartData =
    summary?.monthlyData.map((item) => ({
      month: item.month,
      income: fromCents(item.incomeCents),
      expenses: fromCents(item.expensesCents),
    })) ?? []
  // Primeira meta para exibir no card de progresso do dashboard
  const mainGoal = goals[0]

  // Curso com progresso salvo (o usuário já iniciou)
  const inProgressCourse = courses
    .map((course) => ({
      ...course,
      progress: courseProgress[course.id] ?? course.progress,
    }))
    .find((c) => c.progress !== undefined)

  return (
    <div className="phone-scroll flex-1 overflow-y-auto bg-slate-50 pb-24">
      {/* ── Header com gradiente verde ── */}
      <div
        className="px-5 pt-14 pb-20 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #15803d 0%, #059669 50%, #0d9488 100%)",
        }}
      >
        {/* Círculos decorativos de fundo (puramente visuais) */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white opacity-5" />
        <div className="absolute top-12 -right-4 w-24 h-24 rounded-full bg-white opacity-5" />

        {/* Saudação + avatar + ícone de notificação */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <p className="text-green-200 text-xs font-medium">Bom dia 👋</p>
            {/* Exibe apenas o primeiro nome do usuário */}
            <h2
              className="text-white text-lg font-bold"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {user.name.split(" ")[0]}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Sino de notificação com badge vermelho indicando novas notificações */}
            <button
              type="button"
              onClick={() => navigate("profile")}
              aria-label="Abrir perfil e configurações"
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center relative"
            >
              <Bell size={16} className="text-white" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
            </button>
            {/* Avatar com as iniciais do usuário */}
            <button
              type="button"
              onClick={() => navigate("profile")}
              aria-label="Abrir perfil"
              className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center"
            >
              <span className="text-green-900 font-bold text-xs">
                {user.avatar}
              </span>
            </button>
          </div>
        </div>

        {/* Saldo total em destaque com fonte monospace para números */}
        <div className="relative z-10 mb-4">
          <p className="text-green-200 text-xs font-medium mb-1">
            Patrimônio estimado
          </p>
          <p
            className="text-white text-3xl font-bold tracking-tight"
            style={{ fontFamily: "DM Mono, monospace" }}
          >
            {formatCurrency(balance)}
          </p>
          {summary && (
            <p className="mt-1 text-[10px] text-green-100/80">
              Valor informado e acompanhado por você; não é sincronizado com
              bancos.
            </p>
          )}
          {summary && (
            <p className="mt-1 text-[10px] text-white/90">
              Livre estimado{" "}
              {formatSignedCurrency(fromCents(summary.availableBalanceCents))} ·
              reservado para metas{" "}
              {formatCurrency(fromCents(summary.reservedForGoalsCents))}
            </p>
          )}
        </div>

        {/*
         * Gráfico de área da evolução mensal.
         * Margem negativa `-mb-4` faz o gráfico "mergulhar" no conteúdo abaixo,
         * criando uma transição visual suave entre o header e os cards.
         */}
        <div className="relative z-10 -mb-4">
          <BalanceAreaChart data={chartData} />
        </div>
      </div>

      {/* ── Conteúdo scrollável ── */}
      <div className="px-4 -mt-4 space-y-4">
        {/* Cards de resumo mensal: receitas / despesas / investido */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            {
              label: "Receitas",
              value: formatCurrency(income),
              icon: <TrendingUp size={14} />,
              color: "#16a34a",
              bg: "bg-green-50",
              text: "text-green-600",
            },
            {
              label: "Despesas",
              value: formatCurrency(expenses),
              icon: <TrendingDown size={14} />,
              color: "#dc2626",
              bg: "bg-red-50",
              text: "text-red-500",
            },
            {
              label: "Livre estimado",
              value: formatSignedCurrency(
                fromCents(summary?.availableBalanceCents),
              ),
              icon: <Target size={14} />,
              color: "#7c3aed",
              bg: "bg-violet-50",
              text: "text-violet-600",
            },
          ].map((stat) => (
            <Card key={stat.label} className="p-3">
              {/* Ícone com cor temática */}
              <div
                className={`w-7 h-7 rounded-xl ${stat.bg} ${stat.text} flex items-center justify-center mb-2`}
              >
                {stat.icon}
              </div>
              <p className="text-[9px] text-slate-400 font-medium">
                {stat.label}
              </p>
              {/* Valor numérico usa fonte monospace para alinhamento */}
              <p className="text-xs font-bold text-slate-900 font-mono-data mt-0.5 leading-none">
                {stat.value}
              </p>
            </Card>
          ))}
        </div>

        {/* ── Card de categorias de gasto ── */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3
              className="text-sm font-bold text-slate-900"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Gastos por categoria
            </h3>
            {/* Link para a tela completa de finanças */}
            <button
              onClick={() => navigate("finances")}
              className="text-xs text-green-600 font-semibold"
            >
              Ver tudo
            </button>
          </div>

          {/* Mostra apenas as 3 principais categorias para não sobrecarregar o dashboard */}
          <div className="space-y-2.5">
            {categories.slice(0, 3).map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cat.icon}</span>
                    <span className="text-xs text-slate-700 font-medium">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 font-mono-data">
                    {formatCurrency(cat.amount)}
                  </span>
                </div>
                {/* Barra de progresso representando % do gasto total */}
                <ProgressBar
                  value={cat.percentage}
                  max={100}
                  color={cat.color}
                  height={5}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* ── Card de meta financeira principal ── */}
        {mainGoal ? (
          <Card className="p-4" onClick={() => navigate("goals")}>
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-bold text-slate-900"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Meta principal
              </h3>
              {/* Seta indicando que o card é clicável */}
              <ChevronRight size={14} className="text-slate-400" />
            </div>

            {/* Linha com ícone, nome da meta e percentual */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                style={{ backgroundColor: mainGoal.color + "18" }}
              >
                {mainGoal.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {mainGoal.title}
                </p>
                <p className="text-xs text-slate-400">
                  Prazo:{" "}
                  <span className="text-slate-600 font-medium">
                    {mainGoal.deadline}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 font-mono-data">
                  {Math.round((mainGoal.current / mainGoal.target) * 100)}%
                </p>
                <p className="text-[10px] text-slate-400">concluído</p>
              </div>
            </div>

            {/* Barra de progresso + valores mínimo/máximo */}
            <ProgressBar
              value={mainGoal.current}
              max={mainGoal.target}
              color={mainGoal.color}
              height={8}
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-slate-400 font-mono-data">
                {formatCurrency(mainGoal.current)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono-data">
                {formatCurrency(mainGoal.target)}
              </span>
            </div>
          </Card>
        ) : (
          <Card className="p-4">
            <p className="text-sm font-semibold text-slate-800">
              Nenhuma meta cadastrada
            </p>
            <button
              type="button"
              onClick={() => navigate("financeSetup", "goal")}
              className="mt-2 text-xs font-semibold text-green-700"
            >
              Criar uma meta
            </button>
          </Card>
        )}

        {/* ── Card "Continue aprendendo" ── */}
        {inProgressCourse && (
          <Card
            className="overflow-hidden"
            onClick={() => navigate("courseDetail", inProgressCourse)}
          >
            {/* Fundo com tom suave da cor do curso */}
            <div
              className="px-4 pt-3 pb-3 flex items-center gap-3"
              style={{
                background: `linear-gradient(135deg, ${inProgressCourse.color}15, ${inProgressCourse.color}08)`,
              }}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: inProgressCourse.color + "25" }}
              >
                {inProgressCourse.emoji}
              </div>
              <div className="flex-1 min-w-0">
                {/* Label "Continue aprendendo" em destaque */}
                <div className="flex items-center gap-1.5 mb-0.5">
                  <BookOpen
                    size={10}
                    style={{ color: inProgressCourse.color }}
                  />
                  <span
                    className="text-[9px] font-semibold uppercase tracking-wide"
                    style={{ color: inProgressCourse.color }}
                  >
                    Continue aprendendo
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {inProgressCourse.title}
                </p>
                <p className="text-[10px] text-slate-400">
                  {inProgressCourse.duration} · {inProgressCourse.lessons} aulas
                </p>
              </div>
              <ChevronRight
                size={14}
                className="text-slate-400 flex-shrink-0"
              />
            </div>

            {/* Barra de progresso do curso */}
            <div className="px-4 pb-3 pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-500">Progresso</span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: inProgressCourse.color }}
                >
                  {inProgressCourse.progress}%
                </span>
              </div>
              <ProgressBar
                value={inProgressCourse.progress!}
                max={100}
                color={inProgressCourse.color}
                height={6}
              />
            </div>
          </Card>
        )}

        {/* ── Botão CTA: Nova Transação ── */}
        <button
          onClick={() => navigate("financeSetup", "transaction")}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm text-white active:scale-[0.98] transition-all shadow-md"
          style={{
            background: "linear-gradient(135deg, #16a34a, #059669)",
            boxShadow: "0 4px 16px #16a34a40",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          <Plus size={16} />
          Nova Transação
        </button>
      </div>
    </div>
  )
}
