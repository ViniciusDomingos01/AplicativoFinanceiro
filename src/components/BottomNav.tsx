/**
 * BottomNav.tsx — Barra de navegação inferior do app
 *
 * Componente fixo na base do frame do celular (posição absolute bottom-0).
 * Exibe 4 abas principais com ícone + label, destacando a aba ativa.
 *
 * Props:
 * - `active`   — qual aba está atualmente selecionada
 * - `onChange` — callback chamado ao clicar em uma aba
 *
 * Visibilidade:
 * O componente só é renderizado pelo App.tsx nas telas principais
 * (home, finances, goals, learn, profile). Telas de detalhe (transaction,
 * courseDetail, lesson, quiz) não exibem este componente para evitar
 * sobreposição com seus próprios rodapés de ação.
 *
 * Espaçamento:
 * As telas que exibem este nav devem ter `pb-24` no container scrollável
 * para que o conteúdo não fique escondido atrás da barra (~64px de altura).
 */

import { Home, TrendingUp, BookOpen, User } from "lucide-react"

/** Tipo para as abas disponíveis no bottom nav */
export type NavTab = "home" | "finances" | "learn" | "profile"

interface BottomNavProps {
  /** Aba atualmente ativa */
  active: NavTab
  /** Chamado com o id da aba clicada */
  onChange: (tab: NavTab) => void
}

/** Configuração de cada aba: id, label e ícone Lucide */
const tabs = [
  { id: "home" as NavTab, label: "Início", Icon: Home },
  { id: "finances" as NavTab, label: "Finanças", Icon: TrendingUp },
  { id: "learn" as NavTab, label: "Aprender", Icon: BookOpen },
  { id: "profile" as NavTab, label: "Perfil", Icon: User },
]

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex z-50 pb-2">
      {tabs.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors"
            aria-label={label}
          >
            {/*
             * Container do ícone: recebe fundo verde suave quando ativo.
             * O strokeWidth maior na aba ativa reforça visualmente a seleção.
             */}
            <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-green-50" : ""}`}>
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? "text-green-600" : "text-slate-400"}
              />
            </div>

            {/* Label com peso de fonte maior quando ativo */}
            <span
              className={`text-[10px] font-medium leading-none ${
                isActive ? "text-green-600 font-semibold" : "text-slate-400"
              }`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
