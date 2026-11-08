/**
 * CourseDetail.tsx — Detalhes e estrutura de um curso
 *
 * Exibe o conteúdo completo de um curso selecionado na tela Aprender.
 * Esta é uma tela de detalhe (sem bottom nav no App.tsx).
 *
 * Estrutura:
 * 1. Header hero com gradiente na cor do curso
 *    - Botão voltar, nome, descrição, metadados (rating, duração, alunos, nível)
 *    - Barra de progresso (se o curso já foi iniciado)
 * 2. Lista de módulos expansíveis (accordion)
 *    - Cada módulo mostra o contador de aulas concluídas
 *    - Ao expandir, lista leituras e quizzes com ícones por tipo
 *    - Aulas concluídas ficam com texto tachado
 * 3. Rodapé fixo com botão "Continuar curso"
 *    - Navega direto para a primeira aula não concluída
 *
 * O App.tsx oculta o bottom nav nesta tela; o rodapé com o CTA
 * não sofre sobreposição.
 */

import { useState } from "react"
import {
  ArrowLeft,
  Star,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  BookOpen,
  FileText,
  HelpCircle,
} from "lucide-react"
import { courseModules } from "../data/mockData"
import { ProgressBar } from "../components/UI"
import type { Course, Lesson } from "../data/mockData"

import type { NavigateToScreen } from "../app/routes"

interface CourseDetailProps {
  /** Curso selecionado na tela Aprender (recebido via App.tsx → navigate) */
  course: Course
  completedLessonIds: string[]
  /** Função de navegação global */
  navigate: NavigateToScreen
}

export default function CourseDetail({
  course,
  completedLessonIds,
  navigate,
}: CourseDetailProps) {
  // Controla qual módulo está expandido no accordion (apenas um por vez)
  const [expandedModule, setExpandedModule] = useState("m1")

  /**
   * Retorna o ícone adequado para cada tipo de aula.
   * Aulas concluídas exibem um checkmark verde independente do tipo.
   */
  function lessonIcon(type: Lesson["type"], completed: boolean) {
    if (completed) {
      return (
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <span className="text-white text-[10px]">✓</span>
        </div>
      )
    }
    if (type === "quiz")
      return <HelpCircle size={12} className="text-violet-400" />
    return <FileText size={12} className="text-blue-400" />
  }

  // Contagem total de aulas e aulas concluídas (para barra de progresso do cabeçalho)
  const totalLessons = courseModules.reduce((s, m) => s + m.lessons.length, 0)
  const isCompleted = (lesson: Lesson) =>
    lesson.completed || completedLessonIds.includes(lesson.id)
  const completedLessons = courseModules.reduce(
    (s, m) => s + m.lessons.filter(isCompleted).length,
    0,
  )
  const nextLesson = courseModules
    .flatMap((module) => module.lessons)
    .find((lesson) => !isCompleted(lesson))

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* ── Hero do curso com gradiente temático ── */}
      <div
        className="relative px-5 pt-14 pb-6 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${course.color}dd, ${course.color}99)`,
        }}
      >
        {/* Decorações de fundo */}
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
        {/* Emoji grande decorativo semitransparente */}
        <div className="absolute top-8 right-8 text-7xl opacity-20 select-none">
          {course.emoji}
        </div>

        {/* Botão voltar para a tela Aprender */}
        <button
          onClick={() => navigate("learn")}
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-4"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>

        {/* Label de categoria acima do título */}
        <span className="text-[10px] font-bold uppercase tracking-wide text-white/70 mb-2 block">
          {course.category}
        </span>
        <h2
          className="text-white text-xl font-bold leading-snug mb-2"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          {course.title}
        </h2>
        <p className="text-white/70 text-xs leading-relaxed mb-4">
          {course.description}
        </p>

        {/* Linha de metadados: rating, duração, alunos, nível, gratuito */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          {[
            {
              icon: (
                <Star size={11} className="fill-yellow-300 text-yellow-300" />
              ),
              label: `${course.rating}`,
            },
            {
              icon: <Clock size={11} className="text-white/70" />,
              label: course.duration,
            },
            {
              icon: <Users size={11} className="text-white/70" />,
              label: `${(course.students / 1000).toFixed(1)}k alunos`,
            },
          ].map((m, i) => (
            <span
              key={i}
              className="flex items-center gap-1 text-xs text-white/80 font-medium"
            >
              {m.icon}
              {m.label}
            </span>
          ))}
          {/* Badge de nível */}
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
          >
            {course.level}
          </span>
          {/* Badge "Grátis" — exibido apenas para cursos gratuitos */}
          {course.isFree && (
            <span className="text-[10px] font-bold bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">
              Grátis
            </span>
          )}
        </div>

        {/* Barra de progresso — exibida apenas se o curso já foi iniciado */}
        {course.progress !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-white/70">Progresso</span>
              <span className="text-xs font-bold text-white">
                {completedLessons}/{totalLessons} aulas
              </span>
            </div>
            {/* Cor branca na barra para contraste sobre fundo colorido */}
            <ProgressBar
              value={course.progress}
              max={100}
              color="white"
              height={6}
            />
          </div>
        )}
      </div>

      {/* ── Lista de módulos em accordion ── */}
      <div className="flex-1 phone-scroll overflow-y-auto pb-24">
        <div className="px-4 py-4 space-y-2.5">
          {courseModules.map((mod) => {
            const isExpanded = expandedModule === mod.id
            const modCompleted = mod.lessons.filter(isCompleted).length

            return (
              <div
                key={mod.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Cabeçalho clicável do módulo */}
                <button
                  onClick={() => setExpandedModule(isExpanded ? "" : mod.id)}
                  className="w-full px-4 py-3.5 flex items-center justify-between"
                >
                  <div className="text-left">
                    <p
                      className="text-xs font-bold text-slate-900"
                      style={{ fontFamily: "Outfit, sans-serif" }}
                    >
                      {mod.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {modCompleted}/{mod.lessons.length} aulas concluídas
                    </p>
                  </div>
                  {/* Ícone rotaciona ao expandir */}
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Lista de aulas — visível apenas quando o módulo está expandido */}
                {isExpanded && (
                  <div className="border-t border-slate-50">
                    {mod.lessons.map((lesson, i) => (
                      <button
                        key={lesson.id}
                        onClick={() => navigate("lesson", lesson)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                          i > 0 ? "border-t border-slate-50" : ""
                        }`}
                      >
                        {/* Ícone de tipo/status da aula */}
                        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                          {lessonIcon(lesson.type, isCompleted(lesson))}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Título com tachado se a aula foi concluída */}
                          <p
                            className={`text-xs font-medium ${
                              isCompleted(lesson)
                                ? "text-slate-400 line-through"
                                : "text-slate-800"
                            }`}
                          >
                            {lesson.title}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {lesson.duration}
                          </p>
                        </div>
                        {/* Seta apenas para aulas não concluídas */}
                        {!isCompleted(lesson) && (
                          <ChevronRight
                            size={12}
                            className="text-slate-300 flex-shrink-0"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/*
       * Rodapé fixo com CTA "Continuar curso".
       * O App.tsx oculta o bottom nav nesta tela, evitando sobreposição.
       * Navega para a primeira aula não concluída do módulo 2.
       */}
      <div className="px-4 pb-6 pt-3 bg-white border-t border-slate-100">
        <button
          onClick={() => nextLesson && navigate("lesson", nextLesson)}
          disabled={!nextLesson}
          className="w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          style={{
            background: `linear-gradient(135deg, ${course.color}, ${course.color}cc)`,
            boxShadow: `0 4px 16px ${course.color}40`,
            fontFamily: "Outfit, sans-serif",
          }}
        >
          <BookOpen size={16} />
          Continuar leitura
        </button>
      </div>
    </div>
  )
}
