/**
 * Learn.tsx — Tela principal de educação financeira
 *
 * Central de aprendizado do app. Agrega cursos, artigos e categorias de conteúdo
 * para guiar o usuário em sua jornada de educação financeira.
 *
 * Seções (de cima para baixo):
 * 1. Header com gradiente violeta + barra de busca
 * 2. Filtro de categorias em scroll horizontal (chips)
 * 3. Card de curso em destaque (featured) com CTA
 * 4. Cursos em andamento (com barra de progresso)
 * 5. Conteúdo gratuito em scroll horizontal (cards compactos)
 * 6. Cursos recomendados (lista vertical)
 * 7. Artigos rápidos para leitura
 *
 * Componente interno `CourseCard` é reutilizável para exibir cursos
 * tanto na seção "em andamento" quanto na "recomendados".
 */

import { useState } from "react"
import { Search, ChevronRight, Star, Clock, Zap } from "lucide-react"
import {
  courses,
  learnCategories,
  articles,
  courseModules,
} from "../data/mockData"
import { Card, Modal, ProgressBar } from "../components/UI"
import type { Course } from "../data/mockData"

import type { NavigateToScreen } from "../app/routes"

interface LearnProps {
  /** Função de navegação global recebida do App.tsx */
  navigate: NavigateToScreen
  courseProgress: Record<string, number>
}

export default function Learn({ navigate, courseProgress }: LearnProps) {
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [query, setQuery] = useState("")
  const [selectedArticle, setSelectedArticle] =
    useState<typeof articles[number] | null>(null)

  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  const categoryAliases: Record<string, string[]> = {
    Educação: ["educação financeira"],
    FIIs: ["fundos imobiliários"],
  }
  const matchesCategory = (category: string) => {
    if (activeCategory === "Todos") return true
    return [activeCategory, ...(categoryAliases[activeCategory] ?? [])].some(
      (candidate) => normalize(category).includes(normalize(candidate)),
    )
  }
  const matchesQuery = (value: string) =>
    normalize(value).includes(normalize(query.trim()))
  const coursesWithProgress = courses.map((course) => ({
    ...course,
    progress: courseProgress[course.id] ?? course.progress,
  }))
  const filteredCourses = coursesWithProgress.filter(
    (course) =>
      matchesCategory(course.category) &&
      matchesQuery(
        `${course.title} ${course.description} ${course.category} ${
          course.id === courses[0]?.id
            ? courseModules
                .flatMap((module) => [
                  module.title,
                  ...module.lessons.map((lesson) => lesson.title),
                ])
                .join(" ")
            : ""
        }`,
      ),
  )
  const filteredArticles = articles.filter(
    (article) =>
      matchesCategory(article.category) &&
      matchesQuery(`${article.title} ${article.category}`),
  )

  // Filtra cursos com progresso salvo (usuário já iniciou)
  const inProgress = filteredCourses.filter((c) => c.progress !== undefined)

  // Cursos sem progresso (ainda não iniciados pelo usuário)
  const recommended = filteredCourses.filter((c) => !c.progress)

  // Cursos marcados como gratuitos
  const freeCourses = filteredCourses.filter((c) => c.isFree)

  return (
    <>
      <div className="phone-scroll flex-1 overflow-y-auto bg-slate-50 pb-24">
        {/* ── Header com gradiente violeta + busca ── */}
        <div
          className="px-5 pt-14 pb-6"
          style={{
            background:
              "linear-gradient(135deg, #6d28d9 0%, #7c3aed 60%, #4f46e5 100%)",
          }}
        >
          <h2
            className="text-white text-xl font-bold mb-1"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Aprender
          </h2>
          <p className="text-violet-200 text-xs mb-4">
            Sua jornada de educação financeira
          </p>

          {/* Campo de busca — futuramente conectado a filtro de resultados */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Buscar cursos, aulas e artigos"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar cursos, aulas..."
              className="w-full bg-white rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
        </div>

        <div className="px-4 pt-4 space-y-5">
          {filteredCourses.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center">
              <p className="text-xs font-semibold text-slate-700">
                Nenhum curso encontrado
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Ajuste a busca ou selecione outra categoria.
              </p>
            </div>
          )}
          {/*
           * Filtro de categorias em scroll horizontal.
           * `scrollbar-hide` remove a barra de scroll nativa mantendo a rolagem.
           * `flex-shrink-0` nos botões evita que eles sejam comprimidos.
           */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {learnCategories.map((cat) => {
              const isActive = activeCategory === cat.name
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setActiveCategory(cat.name)}
                  aria-pressed={isActive}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-violet-600 text-white shadow-md"
                      : "bg-white text-slate-500 border border-slate-100"
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              )
            })}
          </div>

          {/* ── Card de curso em destaque (featured) ── */}
          <div
            className={`rounded-2xl overflow-hidden relative p-5 ${
              filteredCourses.some(
                (course) => course.id === coursesWithProgress[1].id,
              )
                ? ""
                : "hidden"
            }`}
            style={{
              background:
                "linear-gradient(135deg, #1e40af, #4f46e5 70%, #6d28d9)",
            }}
          >
            {/* Elementos decorativos */}
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute bottom-0 right-0 text-7xl opacity-20 select-none">
              📊
            </div>

            {/* Badge "Destaque" */}
            <span className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full mb-3">
              ⭐ Destaque
            </span>
            <h3
              className="text-white text-base font-bold mb-1 leading-snug"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Introdução aos Investimentos
            </h3>
            <p className="text-blue-200 text-xs mb-4">
              Gratuito · 14 aulas · 3h 15min
            </p>

            {/* CTA — navega para detalhe do curso gratuito (índice 1) */}
            <button
              onClick={() => navigate("courseDetail", coursesWithProgress[1])}
              className="bg-white text-blue-700 text-xs font-bold px-4 py-2 rounded-xl active:scale-[0.97] transition-all"
            >
              Começar grátis
            </button>
          </div>

          {/* ── Cursos em andamento ── */}
          {inProgress.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-sm font-bold text-slate-900"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  Em andamento
                </h3>
              </div>
              <div className="space-y-2.5">
                {inProgress.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onClick={() => navigate("courseDetail", course)}
                    showProgress // exibe barra de progresso nesta seção
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Conteúdo gratuito em scroll horizontal ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-bold text-slate-900"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {/* Ícone de raio indica conteúdo gratuito/rápido */}
                <span className="inline-flex items-center gap-1">
                  <Zap size={13} className="text-yellow-500" />
                  Conteúdo gratuito
                </span>
              </h3>
            </div>

            {/* Cards compactos em scroll horizontal */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {freeCourses.map((course) => (
                <button
                  type="button"
                  key={course.id}
                  onClick={() => navigate("courseDetail", course)}
                  className="flex-shrink-0 w-44 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-left cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                >
                  {/* Thumbnail com emoji centralizado */}
                  <div
                    className="h-20 flex items-center justify-center text-4xl"
                    style={{ backgroundColor: course.color + "18" }}
                  >
                    {course.emoji}
                  </div>
                  <div className="p-3">
                    <span
                      className="text-[9px] font-bold uppercase tracking-wide"
                      style={{ color: course.color }}
                    >
                      {course.category}
                    </span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 leading-tight line-clamp-2">
                      {course.title}
                    </p>
                    {/* Rating + duração */}
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star
                        size={9}
                        className="text-yellow-400 fill-yellow-400"
                      />
                      <span className="text-[9px] text-slate-500 font-medium">
                        {course.rating}
                      </span>
                      <span className="text-slate-200 text-[9px]">·</span>
                      <Clock size={9} className="text-slate-400" />
                      <span className="text-[9px] text-slate-500">
                        {course.duration}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Cursos recomendados (lista vertical) ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-bold text-slate-900"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Recomendados para você
              </h3>
            </div>
            <div className="space-y-2.5">
              {/* Limita a 3 para não sobrecarregar a tela */}
              {recommended.slice(0, 3).map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => navigate("courseDetail", course)}
                />
              ))}
            </div>
          </div>

          {/* ── Artigos rápidos ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-bold text-slate-900"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Artigos rápidos
              </h3>
            </div>
            <div className="space-y-2.5">
              {filteredArticles.map((article) => (
                <Card
                  key={article.id}
                  className="px-4 py-3 flex items-center gap-3"
                  onClick={() => setSelectedArticle(article)}
                >
                  {/* Ícone do artigo */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: article.color + "15" }}
                  >
                    {article.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                      {article.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock size={9} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400">
                        {article.readTime} de leitura
                      </span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span
                        className="text-[10px]"
                        style={{ color: article.color }}
                      >
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-slate-300 flex-shrink-0"
                  />
                </Card>
              ))}
              {filteredArticles.length === 0 && (
                <p className="rounded-xl bg-white px-4 py-5 text-center text-xs text-slate-500">
                  Nenhum artigo encontrado nesta categoria.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {selectedArticle && (
        <Modal
          title={selectedArticle.title}
          onClose={() => setSelectedArticle(null)}
        >
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{selectedArticle.category}</span>
            <span aria-hidden="true">·</span>
            <span>{selectedArticle.readTime} de leitura</span>
          </div>
          <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            O texto deste artigo não foi incluído nos arquivos exportados do
            protótipo.
          </p>
        </Modal>
      )}
    </>
  )
}

/**
 * CourseCard — Card reutilizável para exibição de um curso na lista
 *
 * Usado nas seções "Em andamento" (com progresso) e "Recomendados" (sem progresso).
 * Mostra: emoji + título + nível + duração + rating + badge gratuito/progresso.
 *
 * @param course       - Dados do curso
 * @param onClick      - Callback ao clicar (navega para courseDetail)
 * @param showProgress - Se true, exibe barra de progresso abaixo das métricas
 */
function CourseCard({
  course,
  onClick,
  showProgress = false,
}: {
  course: Course
  onClick: () => void
  showProgress?: boolean
}) {
  return (
    <Card className="px-4 py-3 flex items-center gap-3" onClick={onClick}>
      {/* Emoji do curso com fundo colorido */}
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ backgroundColor: course.color + "18" }}
      >
        {course.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-900 leading-tight truncate">
          {course.title}
        </p>

        {/* Metadados: nível + duração + rating */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{
              color: course.color,
              backgroundColor: course.color + "15",
            }}
          >
            {course.level}
          </span>
          <span className="text-slate-200 text-[9px]">·</span>
          <Clock size={9} className="text-slate-400" />
          <span className="text-[9px] text-slate-400">{course.duration}</span>
          <span className="text-slate-200 text-[9px]">·</span>
          <Star size={9} className="text-yellow-400 fill-yellow-400" />
          <span className="text-[9px] text-slate-500">{course.rating}</span>
        </div>

        {/* Barra de progresso — exibida apenas em "Em andamento" */}
        {showProgress && course.progress !== undefined && (
          <div className="mt-1.5">
            <ProgressBar
              value={course.progress}
              max={100}
              color={course.color}
              height={4}
            />
          </div>
        )}
      </div>

      {/* Indicador lateral: badge "Grátis" ou percentual de progresso */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {course.isFree ? (
          <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
            Grátis
          </span>
        ) : (
          <ChevronRight size={14} className="text-slate-300" />
        )}
        {showProgress && course.progress !== undefined && (
          <span
            className="text-[10px] font-bold"
            style={{ color: course.color }}
          >
            {course.progress}%
          </span>
        )}
      </div>
    </Card>
  )
}
