/**
 * Onboarding.tsx — Telas de boas-vindas do FinEduca
 *
 * Apresenta 3 slides sequenciais que introduzem as funcionalidades principais
 * do app ao novo usuário antes de entrar no dashboard.
 *
 * Comportamento:
 * - O usuário pode avançar slide a slide com "Continuar"
 * - Pode pular diretamente para o app com o botão "Pular" (canto superior)
 * - No último slide, "Continuar" vira "Começar Agora" e chama `onComplete`
 * - Os indicadores de progresso (dots) são clicáveis para ir a qualquer slide
 *
 * Cada slide tem:
 * - Um emoji principal em card com gradiente específico
 * - 3 emojis decorativos menores (ilustração temática)
 * - Título e descrição
 * - Gradiente de fundo único por slide
 */

import { useState } from "react"
import { ChevronRight, X } from "lucide-react"

/**
 * Configuração de cada slide de onboarding.
 * Para adicionar mais slides, basta incluir novos objetos neste array.
 */
const slides = [
  {
    emoji: "💰",
    color: "#16a34a",
    bg: "from-green-600 to-emerald-400",
    title: "Organize suas Finanças",
    description:
      "Registre receitas, despesas e investimentos em um só lugar. Veja para onde vai seu dinheiro e tome o controle da sua vida financeira.",
    illustration: ["💳", "📊", "🏦"],
  },
  {
    emoji: "📚",
    color: "#2563eb",
    bg: "from-blue-600 to-violet-500",
    title: "Aprenda sobre Dinheiro",
    description:
      "Cursos, aulas e artigos feitos por especialistas. Do básico de finanças pessoais até investimentos avançados em bolsa.",
    illustration: ["🎓", "💡", "📈"],
  },
  {
    emoji: "🎯",
    color: "#7c3aed",
    bg: "from-violet-600 to-purple-400",
    title: "Acompanhe sua Evolução",
    description:
      "Defina metas financeiras, acompanhe seu progresso e celebre cada conquista no caminho para a liberdade financeira.",
    illustration: ["🏆", "⭐", "🚀"],
  },
]

interface OnboardingProps {
  /** Chamado quando o usuário já possui conta e pula o cadastro */
  onComplete: () => void
  /** Chamado no último passo para criar o perfil do usuário */
  onRegister: () => void
}

export default function Onboarding({ onComplete, onRegister }: OnboardingProps) {
  // Índice do slide atual (0–2)
  const [step, setStep] = useState(0)

  const slide = slides[step]
  const isLast = step === slides.length - 1

  /** Avança para o próximo slide ou finaliza o onboarding no último */
  function next() {
    if (isLast) {
      onRegister()
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">

      {/* Blob decorativo de fundo — muda de cor conforme o slide */}
      <div
        className={`absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-15 bg-gradient-to-br ${slide.bg}`}
      />

      {/* Botão "Pular" — disponível em todos os slides */}
      <button
        onClick={onComplete}
        className="absolute top-14 right-5 z-10 flex items-center gap-1 text-slate-400 text-xs font-medium"
      >
        <X size={14} />
        Pular
      </button>

      {/* ── Área de ilustração e conteúdo ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-4">

        {/* Card principal com emoji e gradiente do slide */}
        <div
          className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${slide.bg} flex items-center justify-center text-5xl shadow-lg mb-8`}
        >
          {slide.emoji}
        </div>

        {/* Emojis de ilustração secundária */}
        <div className="flex gap-3 mb-10">
          {slide.illustration.map((item, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shadow-sm"
            >
              {item}
            </div>
          ))}
        </div>

        {/* Título do slide */}
        <h1
          className="text-2xl font-bold text-slate-900 text-center mb-3 leading-tight"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          {slide.title}
        </h1>

        {/* Descrição do slide */}
        <p className="text-sm text-slate-500 text-center leading-relaxed max-w-xs">
          {slide.description}
        </p>
      </div>

      {/* ── Rodapé: indicadores + botões ── */}
      <div className="px-6 pb-10 flex flex-col gap-4">

        {/*
         * Dots de progresso — clicáveis para ir diretamente a um slide.
         * O dot ativo tem largura maior (24px) para indicar posição atual.
         */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                backgroundColor: i === step ? slide.color : "#e2e8f0",
              }}
            />
          ))}
        </div>

        {/* Botão principal: "Continuar" nos intermediários / "Começar Agora" no último */}
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${slide.color}, ${slide.color}cc)`,
            boxShadow: `0 8px 24px ${slide.color}40`,
            fontFamily: "Outfit, sans-serif",
          }}
        >
          {isLast ? "Começar Agora" : "Continuar"}
          <ChevronRight size={18} />
        </button>

        {/* Link secundário "Já tenho uma conta" — oculto no último slide */}
        {!isLast && (
          <button
            onClick={onComplete}
            className="text-center text-sm text-slate-400 font-medium py-1"
          >
            Já tenho uma conta
          </button>
        )}
      </div>
    </div>
  )
}
