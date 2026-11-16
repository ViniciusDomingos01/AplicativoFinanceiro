import type { ReactNode } from "react"
import BottomNav, { type NavTab } from "./BottomNav"
import type { Screen } from "../app/routes"

interface AppShellProps {
  screen: Screen
  theme: "light" | "dark"
  activeTab: NavTab
  showNav: boolean
  onTabChange: (tab: NavTab) => void
  children: ReactNode
}

const LIGHT_STATUS_SCREENS: Screen[] = [
  "home",
  "onboarding",
  "personalData",
  "financeSetup",
  "lesson",
]

export default function AppShell({
  screen,
  theme,
  activeTab,
  showNav,
  onTabChange,
  children,
}: AppShellProps) {
  const lightStatus = LIGHT_STATUS_SCREENS.includes(screen)

  return (
    <div className="app-shell min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 p-4">
      <div className="fixed top-6 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 z-0">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-white/30 text-xs font-medium tracking-widest uppercase">
          FinEduca
        </span>
      </div>

      <div className="app-phone-frame relative flex flex-col overflow-hidden">
        {screen !== "onboarding" && (
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center gap-2"
            aria-hidden="true"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <div className="w-12 h-1.5 bg-slate-800 rounded-full" />
          </div>
        )}

        <div
          className={`absolute top-0 left-0 right-0 h-12 flex items-end justify-between px-6 pb-1.5 z-40 ${
            screen === "onboarding" ? "pointer-events-none" : ""
          }`}
          aria-hidden="true"
        >
          <span
            className="text-[11px] font-semibold font-mono-data"
            style={{
              color: lightStatus
                ? "rgba(255,255,255,0.8)"
                : theme === "dark"
                  ? "#cbd5e1"
                  : "#0f172a",
            }}
          >
            9:41
          </span>
          <div
            className="flex items-center gap-1 text-[9px]"
            style={{
              color: lightStatus ? "rgba(255,255,255,0.6)" : "#94a3b8",
            }}
          >
            <span>●●●</span>
            <span>▂▄▆</span>
            <span>▰</span>
          </div>
        </div>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex flex-col flex-1 overflow-hidden relative outline-none"
        >
          {children}
        </main>

        {showNav && <BottomNav active={activeTab} onChange={onTabChange} />}
      </div>
    </div>
  )
}
