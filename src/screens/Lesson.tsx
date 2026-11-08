/**
 * Lesson.tsx — Tela de visualização de aula
 *
 * Exibe o conteúdo textual de uma aula, pontos principais e próximas leituras.
 *
 * Estrutura:
 * 1. Barra superior escura — botão voltar + barra de progresso geral do curso
 * 2. Painel de leitura com:
 *    - Indicador de módulo e número da aula
 *    - Título e descrição
 *    - Pontos principais da aula (lista numerada)
 *    - Card da próxima aula
 * 4. Rodapé de navegação:
 *    - Botão ← (aula anterior)
 *    - Botão "Marcar como concluída" → navega para o quiz
 *    - Botão → (próxima aula)
 *
 * O App.tsx oculta o bottom nav nesta tela para não sobrepor o rodapé.
 * Vídeos aparecem apenas como material complementar em temas selecionados.
 */

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  BookOpen,
  ExternalLink,
} from "lucide-react"
import { courseModules } from "../data/mockData"
import { ProgressBar } from "../components/UI"
import type { Lesson as LessonType } from "../data/mockData"

interface LessonProps {
  /** Aula atual (recebida via App.tsx → navigate) */
  lesson: LessonType
  /** Função de navegação global */
  navigate: (screen: string, data?: unknown) => void
}

/**
 * Conteúdo textual de aulas específicas (simulando uma API de conteúdo).
 * Em produção, este dado viria de um backend.
 * Fallback é aplicado para aulas sem conteúdo definido aqui.
 */
const lessonContent: Record<
  string,
  { title: string; description: string; points: string[]; videoUrl?: string }
> = {
  l4: {
    title: "A Regra 50/30/20",
    description:
      "A regra 50/30/20 é uma das estratégias mais conhecidas para organizar as finanças pessoais. Ela divide sua renda líquida em três categorias: necessidades, desejos e poupança/investimentos.",
    points: [
      "50% para necessidades básicas: moradia, alimentação, transporte, saúde",
      "30% para desejos: lazer, restaurantes, assinaturas, roupas",
      "20% para poupança e investimentos: reserva de emergência, aposentadoria, metas",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=regra+50+30+20",
  },
  l5: {
    title: "Criando seu Orçamento",
    description:
      "Um orçamento pessoal é o mapa do seu dinheiro. Com ele, você sabe exatamente para onde vai cada real e pode tomar decisões financeiras com clareza e confiança.",
    points: [
      "Liste todas as suas fontes de renda",
      "Mapeie todos os gastos fixos e variáveis",
      "Identifique oportunidades de economia",
      "Defina metas de economia mensais",
    ],
  },
}

export default function Lesson({ lesson, navigate }: LessonProps) {
  // Carrega conteúdo específico da aula ou usa o conteúdo padrão (fallback)
  const content = lessonContent[lesson.id] ?? {
    title: lesson.title,
    description:
      "Este conteúdo apresenta os conceitos essenciais do tema de forma direta, com exemplos para aplicar no seu dia a dia.",
    points: [
      "Conceitos fundamentais da aula",
      "Exemplos práticos do cotidiano",
      "Exercícios de fixação",
    ],
  }

  // Achata todos os módulos em uma lista linear para navegação sequencial
  const allLessons = courseModules.flatMap((m) => m.lessons)
  const currentIdx = allLessons.findIndex((l) => l.id === lesson.id)
  const nextLesson = allLessons[currentIdx + 1]
  const prevLesson = allLessons[currentIdx - 1]

  // Progresso percentual baseado na posição da aula na sequência total
  const progress = Math.round(((currentIdx + 1) / allLessons.length) * 100)

  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* ── Barra superior: voltar + progresso ── */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-4 bg-slate-900">
        <button
          onClick={() => navigate("courseDetail")}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="flex-1">
          {/* Barra verde mostrando posição na sequência de aulas */}
          <ProgressBar value={progress} max={100} color="#4ade80" height={4} />
          <p className="text-white/40 text-[10px] mt-1">
            {currentIdx + 1} de {allLessons.length} aulas
          </p>
        </div>
      </div>

      <div className="flex-1 phone-scroll overflow-y-auto bg-white rounded-t-3xl -mt-1">
        <div className="px-5 py-5">

          {/* Indicador de módulo e número da aula */}
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={14} className="text-violet-500" />
            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wide">
              Módulo 2 · Aula {currentIdx + 1}
            </span>
          </div>

          <h2
            className="text-lg font-bold text-slate-900 mb-3 leading-snug"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {content.title}
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-5">{content.description}</p>

          {content.videoUrl && (
            <a
              href={content.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-3.5 mb-5"
            >
              <div>
                <p className="text-xs font-bold text-violet-800">Vídeo complementar</p>
                <p className="text-[10px] text-violet-500 mt-0.5">
                  Link de referência — gravação própria em breve
                </p>
              </div>
              <ExternalLink size={16} className="text-violet-600 flex-shrink-0" />
            </a>
          )}

          {/* Pontos principais — lista numerada estilizada */}
          <h4
            className="text-sm font-bold text-slate-800 mb-3"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Pontos principais
          </h4>
          <div className="space-y-2.5 mb-6">
            {content.points.map((point, i) => (
              <div key={i} className="flex items-start gap-2.5">
                {/* Número do ponto em círculo verde */}
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-[10px] font-bold">{i + 1}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{point}</p>
              </div>
            ))}
          </div>

          {/* Card de próxima aula — exibido apenas se existir */}
          {nextLesson && (
            <div>
              <h4
                className="text-sm font-bold text-slate-800 mb-2.5"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Próxima aula
              </h4>
              <button
                onClick={() => navigate("lesson", nextLesson)}
                className="w-full flex items-center gap-3 bg-slate-50 rounded-2xl p-3 active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={14} className="text-violet-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold text-slate-800">{nextLesson.title}</p>
                  <p className="text-[10px] text-slate-400">{nextLesson.duration}</p>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/*
       * Rodapé de navegação — 3 controles:
       * ← botão anterior (desabilitado na primeira aula)
       * Botão central "Marcar como concluída" → vai para o quiz
       * → botão próxima (desabilitado na última aula)
       *
       * O App.tsx oculta o bottom nav nesta tela para não sobrepor este rodapé.
       */}
      <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center gap-3">
        {/* Botão anterior */}
        <button
          onClick={() => prevLesson && navigate("lesson", prevLesson)}
          disabled={!prevLesson}
          className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${
            prevLesson
              ? "border-slate-200 text-slate-600 active:scale-95"
              : "border-slate-100 text-slate-300"
          }`}
          aria-label="Aula anterior"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Botão central: marca como concluída e abre o quiz */}
        <button
          onClick={() => navigate("quiz")}
          className="flex-1 py-3 rounded-xl font-semibold text-xs text-white flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
          style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
        >
          <CheckCircle size={14} />
          Marcar como concluída
        </button>

        {/* Botão próxima */}
        <button
          onClick={() => nextLesson && navigate("lesson", nextLesson)}
          disabled={!nextLesson}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            nextLesson
              ? "bg-green-600 text-white active:scale-95"
              : "bg-slate-100 text-slate-300"
          }`}
          aria-label="Próxima aula"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
