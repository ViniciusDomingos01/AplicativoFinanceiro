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

import { useEffect, useRef, type ReactNode } from "react"

export const TEXT_FIELD_CLASS =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
export const FINANCE_FIELD_CLASS =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

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
  /** Se fornecido, torna o card clicável com feedback visual de toque */
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  const cardClass = `bg-white rounded-2xl shadow-sm border border-slate-100 ${
    onClick
      ? "w-full text-left cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200"
      : ""
  } ${className}`

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClass}>
        {children}
      </button>
    )
  }

  return <div className={cardClass}>{children}</div>
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current()
      if (event.key !== "Tab" || !dialogRef.current) return

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      previousFocus?.focus()
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/50 p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="w-full max-w-sm max-h-[90%] overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2
            id="dialog-title"
            className="font-display text-base font-bold text-slate-900"
          >
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200"
            aria-label="Fechar janela"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Toast({
  message,
  kind = "success",
}: {
  message: string
  kind?: "success" | "error"
}) {
  if (!message) return null
  const isError = kind === "error"

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`rounded-2xl border px-3.5 py-3 text-xs font-semibold ${
        isError
          ? "border-red-100 bg-red-50 text-red-700"
          : "border-green-100 bg-green-50 text-green-700"
      }`}
    >
      {message}
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
  const pct =
    max > 0 && Number.isFinite(value)
      ? Math.min(100, Math.max(0, Math.round((value / max) * 100)))
      : 0

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(max, Math.max(0, value))}
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
  /** Fundo customizado; se omitido, usa a cor principal com 10% de opacidade */
}: {
  children: ReactNode
  color?: string
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
  /** Emoji ou string curta para o ícone */
  /** Texto de tendência exibido como badge opcional (ex: "+5%") */
}: {
  label: string
  value: string
  icon: string
  color: string
  bg: string
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
      <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono-data">
        {value}
      </p>
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
  /** Texto do link de ação (ex: "Ver tudo", "Ver todas") */
}: {
  title: string
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
        <button
          type="button"
          onClick={onAction}
          disabled={!onAction}
          className="text-xs text-green-600 font-semibold disabled:cursor-default"
        >
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
  type = "button",
  disabled = false,
  /** Cor de fundo do botão (padrão: verde primário) */
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  color?: string
  type?: "button" | "submit"
  disabled?: boolean
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`w-full py-3.5 rounded-2xl font-semibold text-white text-sm active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
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

export function formatSignedCurrency(value: number) {
  return value < 0 ? `−${formatCurrency(value)}` : formatCurrency(value)
}

export function parseNumericInput(value: string) {
  const trimmed = value.trim().replace(/\s|R\$/g, "")
  if (!trimmed) return Number.NaN
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed
  return Number(normalized)
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
