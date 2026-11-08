/**
 * Quiz.tsx — Tela de avaliação de conhecimento
 *
 * Exibida após o usuário clicar em "Marcar como concluída" numa aula.
 * Testa a compreensão do conteúdo com questões de múltipla escolha.
 *
 * Fluxo da tela:
 * 1. Questão ativa com 4 alternativas (A–D)
 * 2. Usuário seleciona uma alternativa → botão "Confirmar resposta" ativa
 * 3. Ao confirmar: feedback visual (verde = certo, vermelho = errado)
 *    + destaque da alternativa correta + explicação textual
 * 4. Botão "Próxima questão" ou "Ver resultado" na última
 * 5. Tela de resultado: pontuação, percentual e opções de refazer/continuar
 *
 * Estados de navegação de questão:
 * - `current` — índice da questão atual (0-based)
 * - `selected` — índice da alternativa selecionada (null = nenhuma)
 * - `answered` — se o usuário já confirmou a resposta
 * - `score`    — contador de acertos
 * - `finished` — se todas as questões foram respondidas
 *
 * O App.tsx oculta o bottom nav nesta tela.
 */

import { useState } from "react"
import { ArrowLeft, CheckCircle, XCircle, ChevronRight } from "lucide-react"
import { quizQuestions } from "../data/mockData"

import type { NavigateToScreen } from "../app/routes"

interface QuizProps {
  /** Função de navegação global — usada para voltar ou avançar */
  navigate: NavigateToScreen
}

export default function Quiz({ navigate }: QuizProps) {
  const [current, setCurrent] = useState(0) // índice da questão atual
  const [selected, setSelected] = useState<number | null>(null) // alternativa selecionada
  const [answered, setAnswered] = useState(false) // se a resposta foi confirmada
  const [score, setScore] = useState(0) // total de acertos
  const [finished, setFinished] = useState(false) // se o quiz foi concluído

  const question = quizQuestions[current]
  const total = quizQuestions.length
  const isCorrect = selected === question.correct

  /** Confirma a resposta selecionada e incrementa o score se correta */
  function confirm() {
    if (selected === null) return
    setAnswered(true)
    if (selected === question.correct) setScore((s) => s + 1)
  }

  /** Avança para a próxima questão ou finaliza o quiz */
  function next() {
    if (current < total - 1) {
      setCurrent((c) => c + 1)
      setSelected(null) // limpa seleção para a nova questão
      setAnswered(false) // reseta estado de resposta confirmada
    } else {
      setFinished(true)
    }
  }

  // ── Tela de resultado final ──
  if (finished) {
    const pct = Math.round((score / total) * 100)
    const passed = pct >= 70 // aprovação com 70% ou mais de acertos

    return (
      <div className="flex flex-col h-full bg-white items-center justify-center px-6 text-center">
        {/* Ícone temático: troféu se passou, músculo se não */}
        <div
          className={`w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-6 ${
            passed ? "bg-green-50" : "bg-orange-50"
          }`}
        >
          {passed ? "🏆" : "💪"}
        </div>

        <h2
          className="text-2xl font-bold text-slate-900 mb-2"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          {passed ? "Parabéns!" : "Continue praticando!"}
        </h2>
        <p className="text-slate-500 text-sm mb-2">
          Você acertou <span className="font-bold text-slate-900">{score}</span>{" "}
          de <span className="font-bold text-slate-900">{total}</span> questões
        </p>

        {/* Percentual em destaque com cor por aprovação */}
        <div
          className={`text-4xl font-bold mb-6 font-mono-data ${
            passed ? "text-green-600" : "text-orange-500"
          }`}
        >
          {pct}%
        </div>

        {/* Ações: refazer o quiz ou ir para a próxima aula */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => {
              // Reseta todos os estados para reiniciar o quiz
              setCurrent(0)
              setSelected(null)
              setAnswered(false)
              setScore(0)
              setFinished(false)
            }}
            className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold text-sm"
          >
            Refazer quiz
          </button>
          <button
            onClick={() => navigate("courseDetail")}
            className="flex-1 py-3.5 rounded-2xl bg-green-600 text-white font-semibold text-sm active:scale-[0.98] transition-all"
          >
            Próxima aula
          </button>
        </div>
      </div>
    )
  }

  // ── Tela de questão ──
  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* ── Cabeçalho com contador e barras de progresso ── */}
      <div className="px-5 pt-14 pb-4 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          {/* Botão voltar para a aula */}
          <button
            onClick={() => navigate("lesson")}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 mb-1">
              Questão {current + 1} de {total}
            </p>
            {/*
             * Barras de progresso individuais por questão.
             * Verde = respondida, violeta = atual, cinza = futura.
             */}
            <div className="flex gap-1.5">
              {quizQuestions.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-all"
                  style={{
                    backgroundColor:
                      i < current
                        ? "#16a34a" // respondida anteriormente
                        : i === current
                          ? "#7c3aed" // questão atual
                          : "#e2e8f0", // ainda não chegou
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Área da questão e alternativas ── */}
      <div className="flex-1 phone-scroll overflow-y-auto px-5 py-6">
        {/* Card com o enunciado da questão */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-5">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-xl mb-3">
            🤔
          </div>
          <p
            className="text-base font-bold text-slate-900 leading-snug"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {question.question}
          </p>
        </div>

        {/* Alternativas de resposta */}
        <div className="space-y-2.5 mb-6">
          {question.options.map((opt, i) => {
            /*
             * Lógica de estilo dinâmico por estado:
             * - Antes de confirmar: neutro ou violeta (selecionado)
             * - Após confirmar: verde = correta, vermelho = errada selecionada
             */
            let style = "border-slate-200 bg-white text-slate-700"
            if (answered) {
              if (i === question.correct) {
                style = "border-green-500 bg-green-50 text-green-800"
              } else if (i === selected) {
                style = "border-red-400 bg-red-50 text-red-700"
              }
            } else if (selected === i) {
              style = "border-violet-500 bg-violet-50 text-violet-800"
            }

            return (
              <button
                key={i}
                onClick={() =>
                  !answered && setSelected(i)
                // bloqueado após confirmar
                }
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${style}`}
              >
                {/* Círculo com letra da alternativa (A, B, C, D) */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                    selected === i && !answered
                      ? "bg-violet-600 text-white"
                      : answered && i === question.correct
                        ? "bg-green-500 text-white"
                        : answered && i === selected
                          ? "bg-red-400 text-white"
                          : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {String.fromCharCode(65 + i)} {/* A=65, B=66, C=67, D=68 */}
                </div>
                <span className="text-sm font-medium">{opt}</span>

                {/* Ícone de feedback após confirmar */}
                {answered && i === question.correct && (
                  <CheckCircle
                    size={16}
                    className="text-green-500 ml-auto flex-shrink-0"
                  />
                )}
                {answered && i === selected && i !== question.correct && (
                  <XCircle
                    size={16}
                    className="text-red-400 ml-auto flex-shrink-0"
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Explicação da resposta — visível apenas após confirmar */}
        {answered && (
          <div
            className={`rounded-2xl p-4 mb-4 ${
              isCorrect
                ? "bg-green-50 border border-green-100"
                : "bg-red-50 border border-red-100"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-xl">{isCorrect ? "✅" : "❌"}</span>
              <div>
                <p
                  className={`text-sm font-bold mb-1 ${
                    isCorrect ? "text-green-800" : "text-red-700"
                  }`}
                >
                  {isCorrect ? "Resposta correta!" : "Resposta incorreta"}
                </p>
                <p
                  className={`text-xs leading-relaxed ${
                    isCorrect ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {question.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/*
       * Rodapé de ação:
       * - Antes de confirmar: botão "Confirmar resposta" (desabilitado sem seleção)
       * - Após confirmar: botão "Próxima questão" ou "Ver resultado"
       *
       * O App.tsx oculta o bottom nav nesta tela.
       */}
      <div className="px-5 pb-6 pt-2 bg-white border-t border-slate-100">
        {!answered ? (
          <button
            onClick={confirm}
            disabled={selected === null}
            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${
              selected !== null
                ? "bg-violet-600 text-white shadow-lg"
                : "bg-slate-100 text-slate-400"
            }`}
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Confirmar resposta
          </button>
        ) : (
          <button
            onClick={next}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              fontFamily: "Outfit, sans-serif",
            }}
          >
            {current < total - 1 ? "Próxima questão" : "Ver resultado"}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
