export type Screen = "onboarding" | "home" | "finances" | "transaction" | "goals" | "learn" | "courseDetail" | "lesson" | "quiz" | "profile" | "personalData" | "financeSetup"

export type NavigateToScreen = (screen: Screen, data?: unknown) => void

export const ROUTES: Record<Screen, string> = {
  onboarding: "/",
  home: "/home",
  finances: "/finances",
  transaction: "/finances/transactions",
  goals: "/goals",
  learn: "/learn",
  courseDetail: "/learn/courses",
  lesson: "/learn/lessons",
  quiz: "/learn/quiz",
  profile: "/profile",
  personalData: "/profile/personal-data",
  financeSetup: "/finances/setup",
}

const ROUTE_MATCHERS: Array<{
  screen: Screen
  matches: (path: string) => boolean
}> = [
  { screen: "onboarding", matches: (path) => path === "/" },
  { screen: "home", matches: (path) => path === "/home" },
  { screen: "finances", matches: (path) => path === "/finances" },
  {
    screen: "transaction",
    matches: (path) => /^\/finances\/transactions\/[^/]+$/.test(path),
  },
  { screen: "goals", matches: (path) => path === "/goals" },
  { screen: "learn", matches: (path) => path === "/learn" },
  {
    screen: "courseDetail",
    matches: (path) => /^\/learn\/courses\/[^/]+$/.test(path),
  },
  {
    screen: "lesson",
    matches: (path) => /^\/learn\/lessons\/[^/]+$/.test(path),
  },
  { screen: "quiz", matches: (path) => path === "/learn/quiz" },
  { screen: "profile", matches: (path) => path === "/profile" },
  {
    screen: "personalData",
    matches: (path) => path === "/profile/personal-data",
  },
  {
    screen: "financeSetup",
    matches: (path) => /^\/finances\/setup\/[^/]+$/.test(path),
  },
]

export function screenForPath(path: string): Screen | null {
  return ROUTE_MATCHERS.find((route) => route.matches(path))?.screen ?? null
}

export function routeIdFromPath(path: string): string | null {
  const segment = path.split("/").filter(Boolean).at(-1)
  return segment ? decodeURIComponent(segment) : null
}

function idFromData(data: unknown): string | null {
  if (typeof data !== "object" || data === null || !("id" in data)) return null
  const id = data.id
  return typeof id === "string" || typeof id === "number" ? String(id) : null
}

export function pathForScreen(
  screen: Screen,
  data?: unknown,
  fallbackId?: string | null,
): string {
  const base = ROUTES[screen]

  if (screen === "financeSetup") {
    const section = typeof data === "string" ? data : "transaction"
    return `${base}/${encodeURIComponent(section)}`
  }

  if (
    screen === "transaction" ||
    screen === "courseDetail" ||
    screen === "lesson"
  ) {
    const id = idFromData(data) ?? fallbackId
    return id ? `${base}/${encodeURIComponent(id)}` : base
  }

  return base
}
