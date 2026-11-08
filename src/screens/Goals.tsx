/**
 * Goals.tsx — Tela de metas financeiras
 *
 * Permite ao usuário visualizar e acompanhar seus objetivos financeiros.
 * É acessada a partir do Dashboard (card de meta principal) e exibe
 * tanto um resumo consolidado quanto o detalhe de cada meta.
 *
 * Estrutura:
 * 1. Header com gradiente violeta — total economizado vs. meta total geral
 * 2. Lista de cards de metas individuais com:
 *    - Ícone temático + nome + prazo
 *    - Barra de progresso com percentual
 *    - Valores: acumulado / faltam / objetivo
 *    - Botões "Ver detalhes" e "Adicionar valor"
 * 3. Botão para criar nova meta (estilo dashed/pontilhado)
 *
 * Esta tela exibe o bottom nav (está em SCREENS_WITH_NAV no App.tsx),
 * por isso usa `pb-24` no container scrollável.
 */

import { useState, type FormEvent } from "react"
import { Plus, ArrowLeft } from "lucide-react"
import {
  Card,
  Modal,
  ProgressBar,
  formatCurrency,
  parseNumericInput,
  Toast,
} from "../components/UI"
import type { Goal } from "../data/mockData"

import type { NavigateToScreen } from "../app/routes"

interface GoalsProps {
  /** Função de navegação global recebida do App.tsx */
  navigate: NavigateToScreen
  goals: Goal[]
  onChange: (goals: Goal[]) => Promise<void>
}

export default function Goals({ navigate, goals, onChange }: GoalsProps) {
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  const [dialog, setDialog] = useState<"details" | "contribution" | null>(null)
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  // Calcula totais consolidados de todas as metas para o card de visão geral
  const totalSaved = goals.reduce((sum, g) => sum + g.current, 0)
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0)
  const overallPct =
    totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  function openDialog(goal: Goal, type: "details" | "contribution") {
    setActiveGoal(goal)
    setAmount("")
    setError("")
    setDialog(type)
  }

  async function addContribution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeGoal) return
    const contribution = parseNumericInput(amount)
    const remaining = Math.max(0, activeGoal.target - activeGoal.current)
    if (!Number.isFinite(contribution) || contribution <= 0) {
      setError("Informe um valor maior que zero.")
      return
    }
    if (contribution > remaining) {
      setError(`O valor máximo para esta meta é ${formatCurrency(remaining)}.`)
      return
    }
    try {
      await onChange(
        goals.map((goal) =>
          goal.id === activeGoal.id
            ? { ...goal, current: goal.current + contribution }
            : goal,
        ),
      )
      setDialog(null)
      setMessage("Valor reservado para a meta. O patrimônio total não mudou.")
      window.setTimeout(() => setMessage(""), 2600)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível registrar a contribuição.",
      )
    }
  }

  return (
    <>
      <div className="flex flex-col h-full bg-slate-50">
        {/* ── Header com gradiente violeta ── */}
        <div
          className="px-5 pt-14 pb-6 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #6d28d9 0%, #7c3aed 60%, #8b5cf6 100%)",
          }}
        >
          {/* Círculo decorativo */}
          <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-white/5" />

          {/* Navegação + título */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => navigate("home")}
              className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center"
            >
              <ArrowLeft size={16} className="text-white" />
            </button>
            <h2
              className="text-white text-xl font-bold"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Metas Financeiras
            </h2>
          </div>

          {/* Card de visão geral consolidado */}
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              {/* Total declarado como reserva nas metas */}
              <div>
                <p className="text-violet-200 text-xs font-medium">
                  Reservado para metas
                </p>
                <p className="text-white text-xl font-bold font-mono-data mt-0.5">
                  {formatCurrency(totalSaved)}
                </p>
              </div>
              {/* Meta total de todas as metas somadas */}
              <div className="text-right">
                <p className="text-violet-200 text-xs font-medium">
                  Meta total
                </p>
                <p className="text-white/70 text-lg font-bold font-mono-data mt-0.5">
                  {formatCurrency(totalTarget)}
                </p>
              </div>
            </div>
            {/* Barra de progresso geral — cor mais clara para contraste sobre fundo escuro */}
            <ProgressBar
              value={totalSaved}
              max={totalTarget}
              color="#c4b5fd"
              height={8}
            />
            <p className="text-violet-200 text-xs mt-1.5">
              {overallPct}% do total conquistado
            </p>
          </div>
        </div>

        {/* ── Lista de metas individuais ── */}
        <div className="flex-1 phone-scroll overflow-y-auto px-4 py-4 space-y-3 pb-24">
          {message && <Toast message={message} />}
          <p className="rounded-xl bg-violet-50 px-3 py-2 text-[11px] leading-5 text-violet-800">
            Valores nas metas são reservas declaradas por você. Eles fazem parte
            do patrimônio estimado e não contam como receitas.
          </p>
          {goals.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-700">
                Você ainda não tem metas
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Crie uma meta para acompanhar seu progresso.
              </p>
            </div>
          )}
          {goals.map((goal) => {
            // Cálculo do percentual e valor restante para cada meta
            const pct =
              goal.target > 0
                ? Math.round((goal.current / goal.target) * 100)
                : 0
            const remaining = Math.max(0, goal.target - goal.current)

            return (
              <Card key={goal.id} className="p-4">
                {/* Linha superior: ícone + nome + percentual badge */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: goal.color + "18" }}
                  >
                    {goal.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className="text-sm font-bold text-slate-900 leading-tight"
                        style={{ fontFamily: "Outfit, sans-serif" }}
                      >
                        {goal.title}
                      </h4>
                      {/* Badge de percentual na cor da meta */}
                      <span
                        className="text-xs font-bold flex-shrink-0 px-2 py-0.5 rounded-full"
                        style={{
                          color: goal.color,
                          backgroundColor: goal.color + "18",
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Prazo: {goal.deadline}
                    </p>
                  </div>
                </div>

                {/* Barra de progresso da meta individual */}
                <ProgressBar
                  value={goal.current}
                  max={goal.target}
                  color={goal.color}
                  height={8}
                  className="mb-2"
                />

                {/* Linha de valores: acumulado / faltam / objetivo */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-slate-400 font-medium">
                      Acumulado
                    </p>
                    <p className="text-xs font-bold text-slate-800 font-mono-data">
                      {formatCurrency(goal.current)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-slate-400 font-medium">
                      Faltam
                    </p>
                    {/* Valor restante na cor da meta para destaque positivo */}
                    <p
                      className="text-xs font-bold font-mono-data"
                      style={{ color: goal.color }}
                    >
                      {formatCurrency(remaining)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-medium">
                      Objetivo
                    </p>
                    <p className="text-xs font-bold text-slate-800 font-mono-data">
                      {formatCurrency(goal.target)}
                    </p>
                  </div>
                </div>

                {/* Ações do card: botão secundário + botão primário */}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => openDialog(goal, "details")}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold border text-slate-600 border-slate-200 active:scale-[0.98] transition-all"
                  >
                    Ver detalhes
                  </button>
                  <button
                    type="button"
                    onClick={() => openDialog(goal, "contribution")}
                    disabled={remaining === 0}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white active:scale-[0.98] transition-all"
                    style={{ backgroundColor: goal.color }}
                  >
                    Adicionar valor
                  </button>
                </div>
              </Card>
            )
          })}

          {/* Botão para criar nova meta — estilo pontilhado convida à ação */}
          <button
            onClick={() => navigate("financeSetup", "goal")}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 text-slate-400 font-semibold text-sm active:scale-[0.98] transition-all"
          >
            <Plus size={16} />
            Nova meta financeira
          </button>
        </div>
      </div>
      {activeGoal && dialog === "details" && (
        <Modal title={activeGoal.title} onClose={() => setDialog(null)}>
          <p className="text-sm text-slate-600">Prazo: {activeGoal.deadline}</p>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Guardado</span>
              <span>{formatCurrency(activeGoal.current)}</span>
            </div>
            <ProgressBar
              value={activeGoal.current}
              max={activeGoal.target}
              color={activeGoal.color}
              className="my-3"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Objetivo</span>
              <span>{formatCurrency(activeGoal.target)}</span>
            </div>
          </div>
        </Modal>
      )}
      {activeGoal && dialog === "contribution" && (
        <Modal title="Adicionar valor" onClose={() => setDialog(null)}>
          <p className="text-xs leading-relaxed text-slate-500">
            Faltam{" "}
            {formatCurrency(
              Math.max(0, activeGoal.target - activeGoal.current),
            )}{" "}
            para concluir esta meta.
          </p>
          <form onSubmit={addContribution} className="mt-4 space-y-4">
            <label className="block text-xs font-semibold text-slate-600">
              Valor a adicionar (R$)
              <input
                autoFocus
                required
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal"
                placeholder="0,00"
              />
            </label>
            {error && <Toast message={error} kind="error" />}
            <button
              type="submit"
              className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white"
            >
              Confirmar valor
            </button>
          </form>
        </Modal>
      )}
    </>
  )
}
