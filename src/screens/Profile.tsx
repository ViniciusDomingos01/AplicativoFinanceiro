/**
 * Profile.tsx — Tela de perfil do usuário
 *
 * Central de informações pessoais, progresso de aprendizado e configurações do app.
 *
 * Seções:
 * 1. Header escuro (dark slate) — avatar, nome, nível e barra de XP
 * 2. Cards de estatísticas — cursos concluídos, horas estudadas, sequência diária
 * 3. Meus cursos — lista dos cursos em andamento com progresso
 * 4. Metas financeiras — resumo compacto com progresso
 * 5. Configurações — lista de itens com ícones (notificações, privacidade, etc.)
 * 6. Botão de logout e versão do app
 *
 * Esta tela exibe o bottom nav (está em SCREENS_WITH_NAV no App.tsx),
 * por isso usa `pb-24` no container scrollável.
 */

import { useState } from "react"
import {
  Settings,
  ChevronRight,
  Award,
  Bell,
  Moon,
  HelpCircle,
  LogOut,
  Star,
  Shield,
} from "lucide-react"
import { courses } from "../data/mockData"
import { Modal, ProgressBar, Toast } from "../components/UI"
import type { UserProfile } from "../data/mockData"
import type { Goal } from "../data/mockData"

import type { NavigateToScreen } from "../app/routes"

interface ProfileProps {
  /** Função de navegação global recebida do App.tsx */
  navigate: NavigateToScreen
  user: UserProfile
  goals: Goal[]
  onLogout: () => void
  courseProgress: Record<string, number>
  notificationsEnabled: boolean
  onNotificationsChange: (enabled: boolean) => Promise<void>
}

export default function Profile({
  navigate,
  user,
  goals,
  onLogout,
  courseProgress,
  notificationsEnabled,
  onNotificationsChange,
}: ProfileProps) {
  const [dialog, setDialog] =
    useState<"privacy" | "appearance" | "support" | null>(null)
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [message, setMessage] = useState("")
  // Dados de aprendizado (em produção, viriam de uma API)
  const completedCourses = Object.values(courseProgress).filter(
    (progress) => progress >= 100,
  ).length
  const coursesInProgress = Object.values(courseProgress).filter(
    (progress) => progress > 0 && progress < 100,
  ).length

  // Filtra cursos que o usuário já iniciou (têm progresso salvo)
  const inProgress = courses
    .map((course) => ({
      ...course,
      progress: courseProgress[course.id],
    }))
    .filter((course) => course.progress !== undefined)

  return (
    <>
      <div className="phone-scroll flex-1 overflow-y-auto bg-slate-50 pb-24">
        {/* ── Header escuro com avatar e XP ── */}
        <div
          className="px-5 pt-14 pb-6"
          style={{
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
          }}
        >
          {/* Título + botão de configurações */}
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-white text-xl font-bold"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Perfil
            </h2>
            <button
              onClick={() => navigate("personalData")}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
              aria-label="Editar dados pessoais"
            >
              <Settings size={16} className="text-white/70" />
            </button>
          </div>

          {/* Avatar + nome + nível */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              {/* Avatar gerado com gradiente e iniciais do usuário */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {user.avatar}
                </span>
              </div>
              {/* Badge de nível em estrela sobreposto ao avatar */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <Star size={10} className="text-yellow-900 fill-yellow-900" />
              </div>
            </div>
            <div>
              <h3
                className="text-white text-base font-bold"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {user.name}
              </h3>
              {/* Badge de nível de investidor */}
              <span className="text-[10px] font-semibold text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                {user.level}
              </span>
            </div>
          </div>

          {/* Card de progresso de XP */}
          <div className="bg-white/10 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Award size={12} className="text-yellow-400" />
                <span className="text-xs text-white/70 font-medium">
                  XP de Aprendizado
                </span>
              </div>
              <span className="text-xs font-bold text-white font-mono-data">
                {user.xp} / {user.xpNext} XP
              </span>
            </div>
            {/* Barra amarela para contraste sobre fundo escuro */}
            <ProgressBar
              value={user.xp}
              max={user.xpNext}
              color="#facc15"
              height={6}
            />
            <p className="text-white/40 text-[10px] mt-1">
              Faltam {user.xpNext - user.xp} XP para o próximo nível
            </p>
          </div>
        </div>

        {/* ── Conteúdo scrollável ── */}
        <div className="px-4 pt-4 space-y-4">
          {message && <Toast message={message} />}
          {/* Cards de estatísticas de aprendizado */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                icon: "🎓",
                value: completedCourses,
                label: "Concluídos",
                color: "#16a34a",
              },
              {
                icon: "📚",
                value: coursesInProgress,
                label: "Em progresso",
                color: "#2563eb",
              },
              {
                icon: "⭐",
                value: user.xp,
                label: "XP",
                color: "#d97706",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm text-center"
              >
                <span className="text-xl">{stat.icon}</span>
                <p
                  className="text-base font-bold mt-1"
                  style={{
                    color: stat.color,
                    fontFamily: "DM Mono, monospace",
                  }}
                >
                  {stat.value}
                </p>
                <p className="text-[9px] text-slate-400 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* ── Lista de cursos em andamento ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
              <h4
                className="text-sm font-bold text-slate-900"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Meus cursos
              </h4>
              {/* Atalho para a tela de aprender */}
              <button
                onClick={() => navigate("learn")}
                className="text-xs text-green-600 font-semibold"
              >
                Ver todos
              </button>
            </div>

            {inProgress.map((course, i) => (
              <button
                key={course.id}
                onClick={() => navigate("courseDetail", course)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
                  i > 0 ? "border-t border-slate-50" : ""
                }`}
              >
                {/* Emoji do curso com fundo colorido */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: course.color + "18" }}
                >
                  {course.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {course.title}
                  </p>
                  {/* Barra de progresso individual */}
                  <ProgressBar
                    value={course.progress!}
                    max={100}
                    color={course.color}
                    height={4}
                    className="mt-1.5"
                  />
                </div>
                <span
                  className="text-xs font-bold flex-shrink-0"
                  style={{ color: course.color }}
                >
                  {course.progress}%
                </span>
              </button>
            ))}
          </div>

          {/* ── Resumo de metas financeiras ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
              <h4
                className="text-sm font-bold text-slate-900"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Metas financeiras
              </h4>
              {/* Atalho para a tela de metas */}
              <button
                onClick={() => navigate("goals")}
                className="text-xs text-green-600 font-semibold"
              >
                Ver todas
              </button>
            </div>

            {/* Mostra apenas as 3 primeiras metas para resumo compacto */}
            {goals.slice(0, 3).map((goal, i) => {
              const pct = Math.round((goal.current / goal.target) * 100)
              return (
                <div
                  key={goal.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i > 0 ? "border-t border-slate-50" : ""
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: goal.color + "18" }}
                  >
                    {goal.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {goal.title}
                    </p>
                    <ProgressBar
                      value={goal.current}
                      max={goal.target}
                      color={goal.color}
                      height={4}
                      className="mt-1.5"
                    />
                  </div>
                  <span
                    className="text-xs font-bold flex-shrink-0"
                    style={{ color: goal.color }}
                  >
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>

          {/* ── Lista de configurações ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {[
              {
                id: "notifications",
                icon: <Bell size={16} className="text-blue-500" />,
                label: "Notificações",
                bg: "bg-blue-50",
                hasAlert: true, // indica configuração pendente
              },
              {
                id: "privacy",
                icon: <Shield size={16} className="text-green-500" />,
                label: "Privacidade",
                bg: "bg-green-50",
                hasAlert: false,
              },
              {
                id: "appearance",
                icon: <Moon size={16} className="text-violet-500" />,
                label: "Aparência",
                bg: "bg-violet-50",
                hasAlert: false,
              },
              {
                id: "support",
                icon: <HelpCircle size={16} className="text-slate-400" />,
                label: "Ajuda e suporte",
                bg: "bg-slate-50",
                hasAlert: false,
              },
            ].map((item, i) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.id === "notifications") {
                    void onNotificationsChange(!notificationsEnabled)
                      .then(() =>
                        setMessage(
                          !notificationsEnabled
                            ? "Notificações ativadas."
                            : "Notificações desativadas.",
                        ),
                      )
                      .catch((error: unknown) =>
                        setMessage(
                          error instanceof Error
                            ? error.message
                            : "Não foi possível salvar a preferência.",
                        ),
                      )
                  } else {
                    setDialog(item.id as "privacy" | "appearance" | "support")
                  }
                }}
                aria-pressed={
                  item.id === "notifications" ? notificationsEnabled : undefined
                }
                className={`w-full flex items-center gap-3 px-4 py-3.5 ${
                  i > 0 ? "border-t border-slate-50" : ""
                }`}
              >
                {/* Ícone com fundo temático */}
                <div
                  className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}
                >
                  {item.icon}
                </div>
                <span className="flex-1 text-sm text-slate-700 font-medium text-left">
                  {item.label}
                </span>
                {/* Indicador de alerta (ponto vermelho) se houver algo pendente */}
                {item.hasAlert && notificationsEnabled && (
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-1" />
                )}
                {item.id === "notifications" ? (
                  <span
                    className={`text-[10px] font-semibold ${
                      notificationsEnabled ? "text-green-600" : "text-slate-400"
                    }`}
                  >
                    {notificationsEnabled ? "Ativas" : "Desativadas"}
                  </span>
                ) : (
                  <ChevronRight size={14} className="text-slate-300" />
                )}
              </button>
            ))}
          </div>

          {/* Botão de logout com estilo destrutivo (borda vermelha) */}
          <button
            type="button"
            onClick={() => setConfirmingLogout(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-100 text-red-500 font-semibold text-sm active:scale-[0.98] transition-all"
          >
            <LogOut size={15} />
            Sair da conta
          </button>

          {/* Informação de versão e data de cadastro */}
          <p className="text-center text-[10px] text-slate-300 pb-2">
            FinEduca v1.0 · Membro desde {user.memberSince}
          </p>
        </div>
      </div>
      {dialog && (
        <Modal
          title={
            dialog === "privacy"
              ? "Privacidade"
              : dialog === "appearance"
                ? "Aparência"
                : "Ajuda e suporte"
          }
          onClose={() => setDialog(null)}
        >
          <p className="text-sm leading-relaxed text-slate-600">
            {dialog === "privacy"
              ? "Seus registros são privados da sua conta. O aplicativo não se conecta a bancos nem sincroniza saldos."
              : dialog === "appearance"
                ? "O protótipo está usando o tema claro. A preferência de aparência ainda não foi definida para esta versão."
                : "O canal de suporte ainda não foi configurado. Consulte a equipe responsável pelo aplicativo para obter ajuda."}
          </p>
        </Modal>
      )}
      {confirmingLogout && (
        <Modal
          title="Sair da conta?"
          onClose={() => setConfirmingLogout(false)}
        >
          <p className="text-sm leading-relaxed text-slate-600">
            Você será desconectado. Seus registros permanecerão salvos na sua
            conta.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmingLogout(false)}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white"
            >
              Sair
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
