/**
 * TransactionDetail.tsx — Detalhes completos de uma transação
 *
 * Exibe todas as informações de uma transação selecionada na tela de Finanças.
 * Esta é uma tela de detalhe (sem bottom nav), com seu próprio rodapé de ações.
 *
 * Estrutura:
 * 1. Header com gradiente — verde para receitas, escuro para despesas
 *    - Ícone e nome da transação
 *    - Valor formatado com sinal +/- e cor temática
 * 2. Lista de campos da transação (data, categoria, pagamento, tipo, observação)
 * 3. Badge colorido da categoria
 * 4. Rodapé com botões Editar e Excluir
 *
 * Nota de layout:
 * - Esta tela usa `flex flex-col h-full` para ocupar toda a altura disponível
 * - O rodapé fica fixo na base (não scrollável) com `pb-6` de padding seguro
 * - O App.tsx oculta o bottom nav nesta tela para evitar sobreposição
 */

import { useEffect, useState, type FormEvent } from "react"
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  CreditCard,
  Landmark,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react"
import type { Transaction } from "../data/mockData"
import {
  formatCurrency,
  formatDate,
  Modal,
  parseNumericInput,
  Toast,
} from "../components/UI"
import type { SpendingCategory } from "../data/mockData"
import type { ApiFinancialSource } from "../api/client"

import type { NavigateToScreen } from "../app/routes"

interface TransactionDetailProps {
  /** Objeto da transação selecionada (recebido via App.tsx → navigate) */
  transaction: Transaction
  /** Função de navegação global — usada para voltar à tela de finanças */
  navigate: NavigateToScreen
  categories: SpendingCategory[]
  sources: ApiFinancialSource[]
  onSave: (transaction: Transaction) => Promise<void>
  onDelete: () => Promise<void>
}

export default function TransactionDetail({
  transaction: t,
  navigate,
  categories,
  sources,
  onSave,
  onDelete,
}: TransactionDetailProps) {
  // Define visual baseado no tipo: receita = verde, despesa = escuro
  const isIncome = t.type === "income"
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: t.title,
    amount: String(t.amount),
    type: t.type,
    category: t.category,
    date: t.date,
    paymentMethod: t.paymentMethod,
    sourceId: t.sourceId ?? "",
    note: t.note ?? "",
  })

  useEffect(() => {
    setForm({
      title: t.title,
      amount: String(t.amount),
      type: t.type,
      category: t.category,
      date: t.date,
      paymentMethod: t.paymentMethod,
      sourceId: t.sourceId ?? "",
      note: t.note ?? "",
    })
  }, [t])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = parseNumericInput(form.amount)
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Informe uma descrição e um valor maior que zero.")
      return
    }
    const category = categories.find((item) => item.name === form.category)
    setSaving(true)
    try {
      await onSave({
        ...t,
        ...form,
        title: form.title.trim(),
        amount,
        categoryColor: category?.color ?? t.categoryColor,
        icon: category?.icon ?? t.icon,
        note: form.note.trim() || undefined,
      })
      setError("")
      setMessage("Transação atualizada.")
      setEditing(false)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar a transação.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-col h-full bg-slate-50">
        {/* ── Header com gradiente temático ── */}
        <div
          className="px-5 pt-14 pb-8 relative overflow-hidden"
          style={{
            background: isIncome
              ? "linear-gradient(135deg, #15803d, #059669)"
              : "linear-gradient(135deg, #1e293b, #334155)",
          }}
        >
          {/* Círculo decorativo de fundo */}
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-white/5" />

          {/* Botão voltar — retorna para a tela de Finanças */}
          <button
            onClick={() => navigate("finances")}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center mb-6"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>

          {/* Ícone + nome + valor da transação */}
          <div className="flex items-start gap-4">
            {/* Ícone da categoria com fundo semitransparente */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              {t.icon}
            </div>

            <div className="flex-1">
              {/* Label do tipo acima do nome */}
              <p className="text-white/70 text-xs font-medium mb-1">
                {isIncome ? "Receita" : "Despesa"}
              </p>
              <h2
                className="text-white text-xl font-bold"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {t.title}
              </h2>

              {/* Valor com ícone direcional e cor por tipo */}
              <div className="flex items-center gap-1.5 mt-1">
                {isIncome ? (
                  <ArrowUpCircle size={14} className="text-green-300" />
                ) : (
                  <ArrowDownCircle size={14} className="text-red-300" />
                )}
                <span
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: "DM Mono, monospace",
                    color: isIncome ? "#86efac" : "#fca5a5",
                  }}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Área de detalhes scrollável ── */}
        <div className="flex-1 phone-scroll overflow-y-auto px-4 py-5 space-y-3">
          {/* Card de campos da transação */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {[
              {
                icon: <Calendar size={15} className="text-slate-400" />,
                label: "Data",
                value: formatDate(t.date),
              },
              {
                icon: <Tag size={15} style={{ color: t.categoryColor }} />,
                label: "Categoria",
                value: t.category,
              },
              {
                icon: <CreditCard size={15} className="text-slate-400" />,
                label: "Forma de pagamento",
                value: t.paymentMethod,
              },
              {
                icon: <Landmark size={15} className="text-slate-400" />,
                label: "Origem financeira",
                value: t.sourceName ?? "Sem origem vinculada",
              },
              {
                icon: isIncome ? (
                  <ArrowUpCircle size={15} className="text-green-500" />
                ) : (
                  <ArrowDownCircle size={15} className="text-red-400" />
                ),
                label: "Tipo",
                value: isIncome ? "Receita" : "Despesa",
              },
            ].map((row, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  i < 4 ? "border-b border-slate-50" : ""
                }`}
              >
                {/* Ícone do campo com fundo neutro */}
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  {row.icon}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 font-medium">
                    {row.label}
                  </p>
                  <p className="text-sm text-slate-800 font-semibold">
                    {row.value}
                  </p>
                </div>
              </div>
            ))}

            {/* Campo de observação — exibido apenas se existir */}
            {t.note && (
              <div className="flex items-start gap-3 px-4 py-3.5 border-t border-slate-50">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText size={15} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Observação
                  </p>
                  <p className="text-sm text-slate-800">{t.note}</p>
                </div>
              </div>
            )}
          </div>

          {/* Badge da categoria com borda colorida lateral */}
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              backgroundColor: t.categoryColor + "10",
              borderLeft: `3px solid ${t.categoryColor}`,
            }}
          >
            <span className="text-2xl">{t.icon}</span>
            <div>
              <p
                className="text-xs font-semibold"
                style={{ color: t.categoryColor }}
              >
                {t.category}
              </p>
              <p className="text-[10px] text-slate-500">
                Categoria desta transação
              </p>
            </div>
          </div>
        </div>

        {/*
         * Rodapé com ações de editar e excluir.
         * Fica fora do scroll (posição estática no flex column),
         * sempre visível na base da tela sem sobrepor o conteúdo.
         * O App.tsx oculta o bottom nav nesta tela.
         */}
        <div className="px-4 pb-6 pt-3 flex gap-3 bg-white border-t border-slate-100">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 py-3.5 rounded-2xl border-2 border-blue-100 text-blue-600 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Edit2 size={15} />
            Editar
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="flex-1 py-3.5 rounded-2xl border-2 border-red-100 text-red-500 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Trash2 size={15} />
            Excluir
          </button>
        </div>
      </div>
      {message && (
        <div className="fixed left-1/2 top-4 z-[120] w-[min(360px,calc(100vw-24px))] -translate-x-1/2">
          <Toast message={message} />
        </div>
      )}
      {editing && (
        <Modal title="Editar transação" onClose={() => setEditing(false)}>
          <form onSubmit={save} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-600">
              Descrição
              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Valor (R$)
              <input
                required
                inputMode="decimal"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-semibold text-slate-600">
                Tipo
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => {
                      const type = event.target.value as Transaction["type"]
                      return {
                        ...current,
                        type,
                        category:
                          categories.find((item) => item.type === type)?.name ??
                          "",
                      }
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Data
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm({ ...form, date: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-2 py-2.5 text-sm font-normal"
                />
              </label>
            </div>
            <label className="block text-xs font-semibold text-slate-600">
              Categoria
              <select
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
              >
                {!categories.some(
                  (item) =>
                    item.name === form.category &&
                    (!item.type || item.type === form.type),
                ) && <option>{form.category}</option>}
                {categories
                  .filter((item) => !item.type || item.type === form.type)
                  .map((item) => (
                    <option key={item.name}>{item.name}</option>
                  ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Forma de pagamento
              <input
                value={form.paymentMethod}
                onChange={(event) =>
                  setForm({ ...form, paymentMethod: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Origem financeira (opcional)
              <select
                value={form.sourceId}
                onChange={(event) =>
                  setForm({ ...form, sourceId: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
              >
                <option value="">Sem origem vinculada</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Observação
              <textarea
                value={form.note}
                onChange={(event) =>
                  setForm({ ...form, note: event.target.value })
                }
                className="mt-1.5 min-h-16 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
              />
            </label>
            {error && <Toast message={error} kind="error" />}
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white"
            >
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
          </form>
        </Modal>
      )}
      {confirmingDelete && (
        <Modal
          title="Excluir transação?"
          onClose={() => setConfirmingDelete(false)}
        >
          <p className="text-sm leading-relaxed text-slate-600">
            A transação “{t.title}” será removida dos seus registros. Os
            indicadores serão recalculados.
          </p>
          {error && (
            <div className="mt-3">
              <Toast message={error} kind="error" />
            </div>
          )}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() =>
                void onDelete().catch((cause: unknown) =>
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : "Não foi possível excluir a transação.",
                  ),
                )
              }
              disabled={saving}
              className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white"
            >
              Excluir
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
