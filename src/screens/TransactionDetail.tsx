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

import {
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  CreditCard,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react"
import type { Transaction } from "../data/mockData"
import { formatCurrency, formatDate } from "../components/UI"

import type { NavigateToScreen } from "../app/routes"

interface TransactionDetailProps {
  /** Objeto da transação selecionada (recebido via App.tsx → navigate) */
  transaction: Transaction
  /** Função de navegação global — usada para voltar à tela de finanças */
  navigate: NavigateToScreen
}

export default function TransactionDetail({
  transaction: t,
  navigate,
}: TransactionDetailProps) {
  // Define visual baseado no tipo: receita = verde, despesa = escuro
  const isIncome = t.type === "income"

  return (
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
                i < 3 ? "border-b border-slate-50" : ""
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
        <button className="flex-1 py-3.5 rounded-2xl border-2 border-blue-100 text-blue-600 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          <Edit2 size={15} />
          Editar
        </button>
        <button className="flex-1 py-3.5 rounded-2xl border-2 border-red-100 text-red-500 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          <Trash2 size={15} />
          Excluir
        </button>
      </div>
    </div>
  )
}
