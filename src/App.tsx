/**
 * App.tsx — Componente raiz do FinEduca
 *
 * Responsável por:
 * - Renderizar o frame de telefone (mockup visual iPhone)
 * - Gerenciar o estado global de navegação (qual tela está ativa)
 * - Passar a função `navigate` para cada tela filha
 * - Exibir ou ocultar a barra de navegação inferior conforme a tela atual
 *
 * Padrão de navegação:
 * - Telas principais (home, finances, learn, profile) usam o bottom nav
 * - Telas de detalhe (transaction, courseDetail, lesson, quiz, goals)
 *   têm seu próprio cabeçalho/rodapé e NÃO exibem o bottom nav
 */

import { useState } from "react"
import BottomNav, { type NavTab } from "./components/BottomNav"
import Onboarding from "./screens/Onboarding"
import Home from "./screens/Home"
import Finances from "./screens/Finances"
import TransactionDetail from "./screens/TransactionDetail"
import Goals from "./screens/Goals"
import Learn from "./screens/Learn"
import CourseDetail from "./screens/CourseDetail"
import Lesson from "./screens/Lesson"
import Quiz from "./screens/Quiz"
import Profile from "./screens/Profile"
import PersonalData from "./screens/PersonalData"
import FinanceSetup from "./screens/FinanceSetup"
import {
  user as initialUser,
  financialSummary,
  spendingCategories,
  goals,
  transactions,
} from "./data/mockData"
import type { Transaction, Course } from "./data/mockData"
import type { Lesson as LessonType } from "./data/mockData"
import type { UserProfile } from "./data/mockData"
import type { FinanceWorkspace, SetupSection } from "./screens/FinanceSetup"

/**
 * Tipo que representa todas as telas possíveis do app.
 * Cada valor corresponde a um componente de tela diferente.
 */
type Screen =
  | "onboarding"
  | "home"
  | "finances"
  | "transaction"
  | "goals"
  | "learn"
  | "courseDetail"
  | "lesson"
  | "quiz"
  | "profile"
  | "personalData"
  | "financeSetup"

/**
 * Mapeia cada aba do bottom nav para a tela principal que ela representa.
 * Usado ao clicar diretamente em uma aba da barra inferior.
 */
const TAB_SCREENS: Record<NavTab, Screen> = {
  home: "home",
  finances: "finances",
  learn: "learn",
  profile: "profile",
}

/**
 * Mapeia cada tela para a aba do bottom nav que deve ficar ativa.
 * Telas de detalhe herdam a aba da seção pai (ex: courseDetail → learn).
 */
const SCREEN_TO_TAB: Partial<Record<Screen, NavTab>> = {
  home: "home",
  finances: "finances",
  transaction: "finances",  // detalhe de transação pertence à aba Finanças
  goals: "home",             // metas são acessadas pelo Dashboard
  learn: "learn",
  courseDetail: "learn",     // detalhe do curso pertence à aba Aprender
  lesson: "learn",           // aula pertence à aba Aprender
  quiz: "learn",             // quiz pertence à aba Aprender
  profile: "profile",
  personalData: "profile",   // edição de dados pertence à aba Perfil
  financeSetup: "finances",  // cadastros financeiros pertencem à aba Finanças
}

/**
 * Telas que devem exibir o bottom nav.
 * Telas de detalhe (transação, aula, quiz) são excluídas pois têm
 * sua própria navegação/rodapé, evitando sobreposição visual.
 */
const SCREENS_WITH_NAV: Screen[] = ["home", "finances", "goals", "learn", "profile"]

export default function App() {
  // Tela atualmente exibida dentro do frame do celular
  const [screen, setScreen] = useState<Screen>("onboarding")
  const [profile, setProfile] = useState<UserProfile>(initialUser)
  const [personalDataReturn, setPersonalDataReturn] = useState<Screen>("home")
  const [financeSetupSection, setFinanceSetupSection] = useState<SetupSection>("transaction")
  const [financeWorkspace, setFinanceWorkspace] = useState<FinanceWorkspace>({
    balance: financialSummary.totalBalance,
    categories: spendingCategories,
    goals,
    transactions,
  })

  // Aba ativa no bottom nav (independente de estar visível)
  const [activeTab, setActiveTab] = useState<NavTab>("home")

  // Dados da transação selecionada para a tela de detalhe
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  // Curso selecionado para a tela de detalhe do curso
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  // Aula selecionada para a tela de aula
  const [selectedLesson, setSelectedLesson] = useState<LessonType | null>(null)

  /**
   * Função de navegação global passada para todas as telas filhas.
   *
   * @param target - Nome da tela de destino (tipo Screen)
   * @param data   - Dado opcional para telas de detalhe (transação, curso, aula)
   *
   * Exemplo de uso nas telas:
   *   navigate("courseDetail", course)  → abre detalhe do curso
   *   navigate("learn")                 → volta para a lista de cursos
   */
  function navigate(target: string, data?: unknown) {
    const s = target as Screen
    if (s === "personalData") {
      setPersonalDataReturn(screen === "profile" ? "profile" : "home")
    }
    if (s === "financeSetup" && typeof data === "string") {
      setFinanceSetupSection(data as SetupSection)
    }
    setScreen(s)

    // Atualiza a aba ativa com base na tela de destino
    const tab = SCREEN_TO_TAB[s]
    if (tab) setActiveTab(tab)

    // Armazena os dados de contexto para telas de detalhe
    if (s === "transaction" && data) setSelectedTransaction(data as Transaction)
    if (s === "courseDetail" && data) setSelectedCourse(data as Course)
    if (s === "lesson" && data) setSelectedLesson(data as LessonType)
  }

  /**
   * Muda a aba ativa via clique direto no bottom nav.
   * Sempre navega para a tela principal da aba selecionada.
   */
  function handleTabChange(tab: NavTab) {
    setActiveTab(tab)
    setScreen(TAB_SCREENS[tab])
  }

  // Bottom nav só aparece nas telas principais (sem sobreposição com rodapés de detalhe)
  const showNav = SCREENS_WITH_NAV.includes(screen)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 p-4">

      {/* Label decorativo visível apenas em desktop */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 z-0">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-white/30 text-xs font-medium tracking-widest uppercase">FinEduca</span>
      </div>

      {/*
       * Frame do celular — simula um iPhone 14 (390×844px)
       * Bordas arredondadas, borda dupla (borda interna + externa) para
       * parecer com o aro metálico de um dispositivo real.
       */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: 390,
          height: 844,
          background: "#ffffff",
          borderRadius: 52,
          border: "10px solid #1e293b",
          boxShadow:
            "0 0 0 1px #334155, 0 32px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      >
        {/* Notch (entalhe superior) — oculto no onboarding para não quebrar o visual */}
        {screen !== "onboarding" && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <div className="w-12 h-1.5 bg-slate-800 rounded-full" />
          </div>
        )}

        {/*
         * Barra de status (hora + ícones de sinal)
         * A cor do texto muda conforme a tela para garantir contraste
         * sobre fundos claros (telas internas) ou escuros (headers com gradiente).
         */}
        <div
          className={`absolute top-0 left-0 right-0 h-12 flex items-end justify-between px-6 pb-1.5 z-40 ${
            screen === "onboarding" ? "pointer-events-none" : ""
          }`}
        >
          <span
            className="text-[11px] font-semibold"
            style={{
              fontFamily: "DM Mono, monospace",
              color: ["home", "onboarding", "personalData", "financeSetup"].includes(screen)
                ? "rgba(255,255,255,0.8)"
                : screen === "lesson"
                ? "rgba(255,255,255,0.8)"
                : "#0f172a",
            }}
          >
            9:41
          </span>
          <div className="flex items-center gap-1">
            {["●●●", "▂▄▆", "🔋"].map((icon, i) => (
              <span
                key={i}
                className="text-[9px]"
                style={{
                  color: ["home", "onboarding", "personalData", "financeSetup"].includes(screen)
                    ? "rgba(255,255,255,0.6)"
                    : screen === "lesson"
                    ? "rgba(255,255,255,0.6)"
                    : "#94a3b8",
                }}
              >
                {icon}
              </span>
            ))}
          </div>
        </div>

        {/*
         * Área de conteúdo das telas.
         * `overflow-hidden` impede que o conteúdo vaze para fora do frame.
         * Cada tela gerencia seu próprio scroll interno.
         */}
        <div className="flex flex-col flex-1 overflow-hidden relative">

          {/* Tela 1: Onboarding */}
          {screen === "onboarding" && (
            <Onboarding
              onComplete={() => navigate("home")}
              onRegister={() => {
                setPersonalDataReturn("home")
                setScreen("personalData")
              }}
            />
          )}

          {/* Tela 2: Dashboard principal */}
          {screen === "home" && (
            <Home navigate={navigate} user={profile} workspace={financeWorkspace} />
          )}

          {/* Tela 3: Finanças */}
          {screen === "finances" && (
            <Finances navigate={navigate} workspace={financeWorkspace} />
          )}

          {/* Tela 4: Detalhe de transação (requer selectedTransaction) */}
          {screen === "transaction" && selectedTransaction && (
            <TransactionDetail transaction={selectedTransaction} navigate={navigate} />
          )}

          {/* Tela 5: Metas financeiras */}
          {screen === "goals" && (
            <Goals navigate={navigate} goals={financeWorkspace.goals} />
          )}

          {/* Tela 6: Aprender — lista de cursos */}
          {screen === "learn" && (
            <Learn navigate={navigate} />
          )}

          {/* Tela 7: Detalhe do curso (requer selectedCourse) */}
          {screen === "courseDetail" && selectedCourse && (
            <CourseDetail course={selectedCourse} navigate={navigate} />
          )}

          {/* Tela 8: Aula (requer selectedLesson) */}
          {screen === "lesson" && selectedLesson && (
            <Lesson lesson={selectedLesson} navigate={navigate} />
          )}

          {/* Tela 9: Quiz */}
          {screen === "quiz" && (
            <Quiz navigate={navigate} />
          )}

          {/* Tela 10: Perfil do usuário */}
          {screen === "profile" && (
            <Profile navigate={navigate} user={profile} goals={financeWorkspace.goals} />
          )}

          {/* Tela 11: Cadastro e edição de dados pessoais */}
          {screen === "personalData" && (
            <PersonalData
              user={profile}
              isFirstAccess={personalDataReturn === "home"}
              onBack={() => navigate(personalDataReturn)}
              onSave={(updatedProfile) => {
                setProfile(updatedProfile)
                navigate(personalDataReturn)
              }}
            />
          )}

          {/* Tela 12: Cadastro de saldo, categorias, metas e transações */}
          {screen === "financeSetup" && (
            <FinanceSetup
              workspace={financeWorkspace}
              initialSection={financeSetupSection}
              onChange={setFinanceWorkspace}
              onBack={() => navigate("finances")}
            />
          )}
        </div>

        {/*
         * Barra de navegação inferior.
         * Renderizada como `absolute bottom-0` dentro do frame do celular,
         * por isso as telas principais usam `pb-24` para o conteúdo não ficar
         * escondido atrás dela.
         * Ocultada nas telas de detalhe para evitar sobreposição com
         * botões de ação próprios dessas telas.
         */}
        {showNav && (
          <BottomNav active={activeTab} onChange={handleTabChange} />
        )}
      </div>
    </div>
  )
}
