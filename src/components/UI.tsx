/**
 * UI.tsx — Componentes de interface reutilizáveis
 *
 * Biblioteca de primitivas visuais usadas em todas as telas do app.
 * Projetados para serem compostos facilmente e adaptáveis via props.
 *
 * Componentes exportados:
 * - `Card`          — container com bordas arredondadas e sombra sutil
 * - `ProgressBar`   — barra de progresso com cor configurável
 * - `Badge`         — etiqueta colorida para status/categoria
 * - `StatCard`      — card de estatística com ícone, label e valor
 * - `SectionHeader` — cabeçalho de seção com título e ação opcional
 * - `PrimaryButton` — botão principal com cor configurável
 *
 * Funções utilitárias:
 * - `formatCurrency` — formata número para Real brasileiro (R$ 1.234,56)
 * - `formatDate`     — formata string ISO para data legível em PT-BR
 */

import { ReactNode } from "react"

/**
 * Card — Container de conteúdo padrão do app
 *
 * Fundo branco, bordas arredondadas (rounded-2xl = 16px) e sombra sutil.
 * Quando `onClick` é fornecido, adiciona cursor pointer e feedback de toque.
 */
export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode
  className?: string
  /** Se fornecido, torna o card clicável com feedback visual de toque */
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${
        onClick
          ? "cursor-pointer active:scale-[0.98] transition-transform"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * ProgressBar — Barra de progresso linear
 *
 * Usada para representar porcentagem de conclusão de metas, cursos e categorias.
 *
 * @param value     - Valor atual (ex: 65)
 * @param max       - Valor máximo (ex: 100)
 * @param color     - Cor da barra preenchida (hex ou CSS color)
 * @param height    - Altura em pixels (padrão: 8px)
 * @param className - Classes adicionais para o container
 */
export function ProgressBar({
  value,
  max,
  color = "#16a34a",
  height = 8,
  className = "",
}: {
  value: number
  max: number
  color?: string
  height?: number
  className?: string
}) {
  // Garante que o percentual fique entre 0 e 100
  const pct = Math.min(100, Math.round((value / max) * 100))

  return (
    <div
      className={`bg-slate-100 rounded-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

/**
 * Badge — Etiqueta colorida para categorias e status
 *
 * Exibe texto com cor de fundo suave derivada da cor principal.
 * O `bg` pode ser sobrescrito manualmente se necessário.
 */
export function Badge({
  children,
  color = "#16a34a",
  bg,
}: {
  children: ReactNode
  color?: string
  /** Fundo customizado; se omitido, usa a cor principal com 10% de opacidade */
  bg?: string
}) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ color, backgroundColor: bg || color + "18" }}
    >
      {children}
    </span>
  )
}

/**
 * StatCard — Card de estatística com ícone, label e valor
 *
 * Usado nos dashboards para exibir métricas financeiras de forma compacta.
 * O `trend` é opcional e exibe um badge verde (ex: "+12%") no canto.
 */
export function StatCard({
  label,
  value,
  icon,
  color,
  bg,
  trend,
}: {
  label: string
  value: string
  /** Emoji ou string curta para o ícone */
  icon: string
  color: string
  bg: string
  /** Texto de tendência exibido como badge opcional (ex: "+5%") */
  trend?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex-1">
      <div className="flex items-start justify-between mb-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
          style={{ backgroundColor: bg }}
        >
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] text-slate-500 font-medium">{label}</p>
      {/* Valor usa fonte monospace para alinhamento numérico */}
      <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono-data">{value}</p>
    </div>
  )
}

/**
 * SectionHeader — Cabeçalho de seção com título e ação opcional
 *
 * Exibido antes de listas ou grupos de conteúdo relacionado.
 * O botão de ação (ex: "Ver tudo") é opcional e aparece alinhado à direita.
 */
export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string
  /** Texto do link de ação (ex: "Ver tudo", "Ver todas") */
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3
        className="text-sm font-bold text-slate-900"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        {title}
      </h3>
      {action && (
        <button onClick={onAction} className="text-xs text-green-600 font-semibold">
          {action}
        </button>
      )}
    </div>
  )
}

/**
 * PrimaryButton — Botão de ação principal (CTA)
 *
 * Largura total, bordas arredondadas, texto branco.
 * A cor de fundo é configurável para adaptar a cada seção do app.
 */
export function PrimaryButton({
  children,
  onClick,
  className = "",
  color = "#16a34a",
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  /** Cor de fundo do botão (padrão: verde primário) */
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-3.5 rounded-2xl font-semibold text-white text-sm active:scale-[0.98] transition-all ${className}`}
      style={{ backgroundColor: color, fontFamily: "Outfit, sans-serif" }}
    >
      {children}
    </button>
  )
}

/**
 * formatCurrency — Formata número para moeda brasileira
 *
 * Usa o valor absoluto para não duplicar o sinal negativo (o sinal
 * é gerenciado pela UI de cada componente com "+" ou "-" explícito).
 *
 * @example formatCurrency(1234.5) → "R$ 1.234,50"
 * @example formatCurrency(-420.3) → "R$ 420,30"
 */
export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(value))
}

/**
 * formatDate — Formata string de data ISO para PT-BR legível
 *
 * Adiciona "T12:00:00" para evitar problemas de fuso horário que podem
 * causar o dia aparecer como o dia anterior em alguns ambientes.
 *
 * @example formatDate("2025-07-15") → "15 de jul. de 2025"
 */
export function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
