import { lazy, Suspense, useCallback, useEffect, useState } from "react"
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom"
import AppShell from "./components/AppShell"
import type { NavTab } from "./components/BottomNav"
import {
  pathForScreen,
  routeIdFromPath,
  ROUTES,
  screenForPath,
  type NavigateToScreen,
  type Screen,
} from "./app/routes"
import {
  user as initialUser,
  financialSummary,
  spendingCategories,
  goals,
  transactions,
  courses,
  courseModules,
} from "./data/mockData"
import type {
  Transaction,
  Course,
  Lesson as LessonType,
  UserProfile,
  Goal,
} from "./data/mockData"
import type { FinanceWorkspace, SetupSection } from "./screens/FinanceSetup"
import {
  api,
  ApiError,
  fromCents,
  toCents,
  type ApiCategory,
  type ApiFinancialSource,
  type ApiBudget,
  type ApiProfile,
  type ApiSummary,
  type ApiTransaction,
} from "./api/client"

const Onboarding = lazy(() => import("./screens/Onboarding"))
const Auth = lazy(() => import("./screens/Auth"))
const Home = lazy(() => import("./screens/Home"))
const Finances = lazy(() => import("./screens/Finances"))
const TransactionDetail = lazy(() => import("./screens/TransactionDetail"))
const Goals = lazy(() => import("./screens/Goals"))
const Learn = lazy(() => import("./screens/Learn"))
const CourseDetail = lazy(() => import("./screens/CourseDetail"))
const Lesson = lazy(() => import("./screens/Lesson"))
const Quiz = lazy(() => import("./screens/Quiz"))
const Profile = lazy(() => import("./screens/Profile"))
const PersonalData = lazy(() => import("./screens/PersonalData"))
const FinanceSetup = lazy(() => import("./screens/FinanceSetup"))
const FinanceOrganization = lazy(() => import("./screens/FinanceOrganization"))

const TAB_SCREENS: Record<NavTab, Screen> = {
  home: "home",
  finances: "finances",
  learn: "learn",
  profile: "profile",
}

const SCREEN_TO_TAB: Partial<Record<Screen, NavTab>> = {
  home: "home",
  finances: "finances",
  financeOrganization: "finances",
  transaction: "finances",
  financeSetup: "finances",
  goals: "home",
  learn: "learn",
  courseDetail: "learn",
  lesson: "learn",
  quiz: "learn",
  profile: "profile",
  personalData: "profile",
}

const SCREENS_WITH_NAV: Screen[] = [
  "home",
  "finances",
  "financeOrganization",
  "goals",
  "learn",
  "profile",
]
const SETUP_SECTIONS: SetupSection[] = [
  "balance",
  "transaction",
  "category",
  "goal",
]

interface NavigationState {
  entity?: unknown
  mode?: "login" | "register"
}

type AuthStatus = "loading" | "anonymous" | "authenticated" | "unavailable"
type Theme = "light" | "dark"

function initialTheme(): Theme {
  try {
    return localStorage.getItem("fineduca-theme") === "dark" ? "dark" : "light"
  } catch {
    return "light"
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function uiDate(value: string | null | undefined) {
  if (!value) return "Sem prazo"
  const date = value.slice(0, 10)
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  })
}

function goalDate(value: string, date?: string) {
  if (date) return date.slice(0, 10)
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? `${value}-01` : null
}

export default function App() {
  const location = useLocation()
  const routerNavigate = useNavigate()
  const screen = screenForPath(location.pathname) ?? "onboarding"
  const [profile, setProfile] = useState<UserProfile>(initialUser)
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading")
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [personalDataReturn, setPersonalDataReturn] = useState<Screen>("home")
  const [financeWorkspace, setFinanceWorkspace] = useState<FinanceWorkspace>({
    balance: financialSummary.totalBalance,
    initialBalance: financialSummary.totalBalance,
    trackingStartDate: null,
    categories: spendingCategories,
    goals,
    transactions,
  })
  const [financeSummary, setFinanceSummary] = useState<ApiSummary | null>(null)
  const [financialSources, setFinancialSources] =
    useState<ApiFinancialSource[]>([])
  const [budgets, setBudgets] = useState<ApiBudget[]>([])
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<LessonType | null>(null)
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() =>
    courseModules.flatMap((module) =>
      module.lessons
        .filter((lesson) => lesson.completed)
        .map((lesson) => lesson.id),
    ),
  )
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>(
    {},
  )
  const [rewardedLessonIds, setRewardedLessonIds] = useState<string[]>([])

  const loadAuthenticatedData = useCallback(async () => {
    const userData = await api.get<ApiProfile>("/profile")
    const month = new Date().toISOString().slice(0, 7)
    const [
      categories,
      sources,
      budgetsResponse,
      transactionResponse,
      goalResponse,
      learning,
    ] = await Promise.all([
      api.get<ApiCategory[]>("/finance/categories"),
      api.get<ApiFinancialSource[]>("/finance/sources"),
      api.get<ApiBudget[]>(`/budgets?month=${month}`),
      userData.baseline
        ? api.get<ApiTransaction[]>("/finance/transactions?limit=500")
        : Promise.resolve([] as ApiTransaction[]),
      api.get<Array<{
        id: string
        title: string
        targetCents: string
        currentReservedCents: string
        deadline: string | null
      }>>("/goals"),
      api.get<{
        lessons: Array<{ courseId: string; lessonId: string }>
        attempts: Array<{ lessonId: string; xpAwarded: number }>
        xp: number
      }>("/learning/progress"),
    ])
    const today = new Date().toISOString().slice(0, 10)
    const monthStart = `${today.slice(0, 7)}-01`
    const summary = userData.baseline
      ? await api.get<ApiSummary>(
          `/finance/summary?from=${monthStart}&through=${today}`,
        )
      : null
    const spendingById = new Map(
      summary?.spendingCategories.map((item) => [item.id, item]) ?? [],
    )
    setFinanceSummary(summary)
    setFinancialSources(sources)
    setBudgets(budgetsResponse)

    setProfile({
      ...initialUser,
      name: userData.profile?.name ?? "",
      email: userData.email,
      phone: userData.profile?.phone ?? "",
      monthlyIncome: String(fromCents(userData.profile?.monthlyIncomeCents)),
      financialGoal: userData.profile?.financialGoal ?? "",
      avatar: initials(userData.profile?.name ?? "FE"),
      xp: learning.xp,
      memberSince: uiDate(userData.profile?.createdAt),
    })
    setFinanceWorkspace({
      balance: fromCents(
        summary?.estimatedBalanceCents ??
          userData.baseline?.initialBalanceCents,
      ),
      initialBalance: userData.baseline
        ? fromCents(userData.baseline.initialBalanceCents)
        : null,
      trackingStartDate:
        userData.baseline?.trackingStartDate.slice(0, 10) ?? null,
      categories: categories.map((category) => {
        const spending = spendingById.get(category.id)
        return {
          id: category.id,
          name: category.name,
          amount: fromCents(spending?.amountCents),
          percentage: spending?.percentage ?? 0,
          color: category.color ?? "#64748b",
          icon: category.icon ?? "•",
          type: category.type.toLowerCase() as "income" | "expense",
        }
      }),
      goals: goalResponse.map((goal) => ({
        id: goal.id,
        title: goal.title,
        icon: "🎯",
        color: "#16a34a",
        current: fromCents(goal.currentReservedCents),
        target: fromCents(goal.targetCents),
        deadline: uiDate(goal.deadline),
        deadlineDate: goal.deadline?.slice(0, 10) ?? undefined,
      })),
      transactions: transactionResponse.map((transaction) => ({
        id: transaction.id,
        title: transaction.description,
        amount: fromCents(transaction.amountCents),
        type: transaction.type.toLowerCase() as "income" | "expense",
        category: transaction.category.name,
        categoryId: transaction.categoryId,
        categoryColor: transaction.category.color ?? "#64748b",
        date: transaction.date.slice(0, 10),
        paymentMethod: transaction.paymentMethod ?? "Não informado",
        sourceId: transaction.sourceId,
        sourceName: transaction.source?.name ?? null,
        note: transaction.note ?? undefined,
        icon: transaction.category.icon ?? "•",
      })),
    })

    const completedIds = learning.lessons.map((lesson) => lesson.lessonId)
    setCompletedLessonIds(completedIds)
    setRewardedLessonIds(
      learning.attempts
        .filter((attempt) => attempt.xpAwarded > 0)
        .map((attempt) => attempt.lessonId),
    )
    const progress: Record<string, number> = {}
    for (const course of courses) {
      const totalLessons = courseModules.flatMap(
        (module) => module.lessons,
      ).length
      const completedCount = learning.lessons.filter(
        (lesson) => lesson.courseId === course.id,
      ).length
      if (completedCount > 0)
        progress[course.id] = Math.min(
          100,
          Math.round(
            (completedCount / Math.max(course.lessons, totalLessons)) * 100,
          ),
        )
    }
    setCourseProgress(progress)
    return Boolean(userData.baseline)
  }, [])

  const fetchFinanceSummary = useCallback(
    async (from: string, through: string) => {
      return api.get<ApiSummary>(
        `/finance/summary?from=${encodeURIComponent(from)}&through=${encodeURIComponent(through)}`,
      )
    },
    [],
  )

  const changeFinancePeriod = fetchFinanceSummary

  useEffect(() => {
    let mounted = true
    api
      .get("/auth/session")
      .then(() => loadAuthenticatedData())
      .then(() => {
        if (mounted) setAuthStatus("authenticated")
      })
      .catch((error: unknown) => {
        if (!mounted) return
        if (error instanceof ApiError && error.status === 401)
          setAuthStatus("anonymous")
        else setAuthStatus("unavailable")
      })
    return () => {
      mounted = false
    }
  }, [loadAuthenticatedData])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem("fineduca-theme", theme)
    } catch {
      // O tema continua ativo nesta sessão mesmo se o armazenamento local estiver indisponível.
    }
  }, [theme])

  const routeId = routeIdFromPath(location.pathname)
  const navigationState = location.state as NavigationState | null
  const routeEntity = navigationState?.entity
  const transactionFromRoute = routeEntity as Transaction | undefined
  const courseFromRoute = routeEntity as Course | undefined
  const lessonFromRoute = routeEntity as LessonType | undefined

  const currentTransaction =
    (selectedTransaction?.id === routeId ? selectedTransaction : undefined) ??
    (transactionFromRoute?.id === routeId ? transactionFromRoute : undefined) ??
    financeWorkspace.transactions.find(
      (transaction) => transaction.id === routeId,
    ) ??
    null
  const currentCourse =
    (courseFromRoute?.id === routeId ? courseFromRoute : undefined) ??
    (selectedCourse?.id === routeId ? selectedCourse : undefined) ??
    courses.find((course) => course.id === routeId) ??
    null
  const currentLesson =
    screen === "quiz"
      ? (lessonFromRoute ?? selectedLesson)
      : ((lessonFromRoute?.id === routeId ? lessonFromRoute : undefined) ??
        (selectedLesson?.id === routeId ? selectedLesson : undefined) ??
        courseModules
          .flatMap((module) => module.lessons)
          .find((lesson) => lesson.id === routeId) ??
        null)

  const setupSectionFromPath = routeIdFromPath(location.pathname)
  const financeSetupSection: SetupSection = SETUP_SECTIONS.includes(
    setupSectionFromPath as SetupSection,
  )
    ? setupSectionFromPath as SetupSection
    : "transaction"

  const navigate: NavigateToScreen = (destination, data) => {
    if (destination === "personalData") {
      setPersonalDataReturn(screen === "profile" ? "profile" : "home")
    }
    if (destination === "transaction" && data)
      setSelectedTransaction(data as Transaction)
    if (destination === "courseDetail" && data)
      setSelectedCourse(data as Course)
    if (destination === "lesson" && data) setSelectedLesson(data as LessonType)

    const fallbackId =
      destination === "transaction"
        ? currentTransaction?.id
        : destination === "courseDetail"
          ? (currentCourse?.id ?? courses[0]?.id)
          : destination === "lesson"
            ? currentLesson?.id
            : null
    const path = pathForScreen(destination, data, fallbackId)
    const navigationEntity =
      data ?? (destination === "quiz" ? currentLesson : undefined)
    routerNavigate(
      path,
      navigationEntity === undefined
        ? undefined
        : { state: { entity: navigationEntity } },
    )
  }

  async function updateTransaction(previous: Transaction, next: Transaction) {
    const category = financeWorkspace.categories.find(
      (item) => item.name === next.category && item.type === next.type,
    )
    if (!category?.id)
      throw new Error("Cadastre uma categoria para este tipo de movimentação.")
    await api.patch(`/finance/transactions/${previous.id}`, {
      type: next.type.toUpperCase(),
      amountCents: toCents(next.amount),
      description: next.title,
      date: next.date,
      paymentMethod: next.paymentMethod,
      sourceId: next.sourceId ?? null,
      categoryId: category.id,
      note: next.note ?? null,
    })
    await loadAuthenticatedData()
    setSelectedTransaction({
      ...next,
      sourceName:
        financialSources.find((source) => source.id === next.sourceId)?.name ??
        null,
    })
  }

  async function deleteTransaction(transaction: Transaction) {
    await api.delete(`/finance/transactions/${transaction.id}`)
    await loadAuthenticatedData()
    setSelectedTransaction(null)
    routerNavigate(ROUTES.finances)
  }

  async function updateGoals(nextGoals: Goal[]) {
    const currentById = new Map(
      financeWorkspace.goals.map((goal) => [goal.id, goal]),
    )
    const nextById = new Map(nextGoals.map((goal) => [goal.id, goal]))
    for (const previous of financeWorkspace.goals) {
      if (!nextById.has(previous.id)) await api.delete(`/goals/${previous.id}`)
    }
    for (const goal of nextGoals) {
      const previous = currentById.get(goal.id)
      const targetCents = toCents(goal.target)
      if (!previous) {
        const created = await api.post<{ id: string }>("/goals", {
          title: goal.title,
          targetCents,
          deadline: goalDate(goal.deadline, goal.deadlineDate),
        })
        if (goal.current > 0) {
          await api.post(`/goals/${created.id}/contributions`, {
            amountCents: toCents(goal.current),
            date: new Date().toISOString().slice(0, 10),
          })
        }
        continue
      }
      if (
        previous.title !== goal.title ||
        previous.target !== goal.target ||
        previous.deadlineDate !== goal.deadlineDate
      ) {
        await api.patch(`/goals/${goal.id}`, {
          title: goal.title,
          targetCents,
          deadline: goalDate(goal.deadline, goal.deadlineDate),
        })
      }
      const contribution = Math.max(0, goal.current - previous.current)
      if (contribution > 0) {
        await api.post(`/goals/${goal.id}/contributions`, {
          amountCents: toCents(contribution),
          date: new Date().toISOString().slice(0, 10),
        })
      }
    }
    await loadAuthenticatedData()
  }

  async function updateFinanceWorkspace(next: FinanceWorkspace) {
    const previous = financeWorkspace
    try {
      if (
        next.initialBalance !== previous.initialBalance ||
        next.trackingStartDate !== previous.trackingStartDate
      ) {
        if (next.initialBalance == null || !next.trackingStartDate) {
          throw new Error("Informe o patrimônio inicial e a data de início.")
        }
        await api.put("/finance/baseline", {
          initialBalanceCents: toCents(next.initialBalance),
          trackingStartDate: next.trackingStartDate,
        })
      }

      const knownCategoryIds = new Set(
        previous.categories.map((category) => category.id).filter(Boolean),
      )
      for (const category of next.categories) {
        if (category.id && knownCategoryIds.has(category.id)) continue
        await api.post("/finance/categories", {
          name: category.name,
          type: category.type?.toUpperCase() ?? "EXPENSE",
          color: category.color,
          icon: category.icon,
        })
      }
      const currentCategories = await api.get<ApiCategory[]>(
        "/finance/categories",
      )
      const oldTransactions = new Map(
        previous.transactions.map((transaction) => [
          transaction.id,
          transaction,
        ]),
      )
      const nextTransactionIds = new Set(
        next.transactions.map((transaction) => transaction.id),
      )
      for (const transaction of previous.transactions) {
        if (!nextTransactionIds.has(transaction.id)) {
          await api.delete(`/finance/transactions/${transaction.id}`)
        }
      }
      for (const transaction of next.transactions) {
        const category = currentCategories.find(
          (item) =>
            item.name === transaction.category &&
            item.type.toLowerCase() === transaction.type,
        )
        if (!category)
          throw new Error(
            "Cadastre uma categoria compatível antes de registrar a movimentação.",
          )
        const body = {
          type: transaction.type.toUpperCase(),
          amountCents: toCents(transaction.amount),
          description: transaction.title,
          date: transaction.date,
          paymentMethod: transaction.paymentMethod,
          sourceId: transaction.sourceId ?? null,
          categoryId: category.id,
          note: transaction.note ?? null,
        }
        if (oldTransactions.has(transaction.id)) {
          await api.patch(`/finance/transactions/${transaction.id}`, body)
        } else {
          await api.post("/finance/transactions", body)
        }
      }
      await updateGoals(next.goals)
      await loadAuthenticatedData()
    } catch (error) {
      await loadAuthenticatedData().catch(() => undefined)
      throw error
    }
  }

  async function finishQuiz(result: {
    score: number
    total: number
    passed: boolean
  }) {
    const lessonId = currentLesson?.id
    if (!lessonId) return
    await api.post("/learning/quiz-attempts", {
      courseId: (currentCourse ?? courses[0])?.id ?? "1",
      lessonId,
      score: result.score,
      total: result.total,
    })
    await loadAuthenticatedData()
  }

  async function handleLogout() {
    try {
      await api.post("/auth/logout")
    } finally {
      setAuthStatus("anonymous")
      setProfile(initialUser)
      setFinanceWorkspace({
        balance: 0,
        initialBalance: null,
        trackingStartDate: null,
        categories: [],
        goals: [],
        transactions: [],
      })
      setFinanceSummary(null)
      setFinancialSources([])
      setBudgets([])
      setSelectedTransaction(null)
      setSelectedCourse(null)
      setSelectedLesson(null)
      setPersonalDataReturn("home")
      setCourseProgress({})
      setCompletedLessonIds([])
      setRewardedLessonIds([])
      routerNavigate(ROUTES.onboarding)
    }
  }

  function handleTabChange(tab: NavTab) {
    routerNavigate(ROUTES[TAB_SCREENS[tab]])
  }

  async function handleAuthenticated() {
    const hasBaseline = await loadAuthenticatedData()
    setAuthStatus("authenticated")
    routerNavigate(
      hasBaseline ? ROUTES.home : `${ROUTES.financeSetup}/balance`,
      { replace: true },
    )
  }

  function renderScreen(target: Screen) {
    switch (target) {
      case "onboarding":
        return (
          <Onboarding
            onComplete={() => navigate("auth", { mode: "login" })}
            onRegister={() => navigate("auth", { mode: "register" })}
          />
        )
      case "auth": {
        const mode =
          (routeEntity as { mode?: "login" | "register" } | undefined)?.mode ??
          navigationState?.mode ??
          "login"
        return (
          <Auth
            initialMode={mode}
            onAuthenticated={handleAuthenticated}
            onBack={() => navigate("onboarding")}
          />
        )
      }
      case "home":
        return (
          <Home
            navigate={navigate}
            user={profile}
            workspace={financeWorkspace}
            courseProgress={courseProgress}
            summary={financeSummary}
          />
        )
      case "finances":
        return (
          <Finances
            navigate={navigate}
            workspace={financeWorkspace}
            initialSummary={financeSummary}
            onPeriodChange={changeFinancePeriod}
          />
        )
      case "financeOrganization":
        return (
          <FinanceOrganization
            categories={financeWorkspace.categories}
            sources={financialSources}
            budgets={budgets}
            onRefresh={loadAuthenticatedData}
            onBack={() => navigate("finances")}
          />
        )
      case "transaction":
        return currentTransaction ? (
          <TransactionDetail
            transaction={currentTransaction}
            categories={financeWorkspace.categories}
            sources={financialSources}
            onSave={(updated) => updateTransaction(currentTransaction, updated)}
            onDelete={() => deleteTransaction(currentTransaction)}
            navigate={navigate}
          />
        ) : (
          <Navigate to={ROUTES.finances} replace />
        )
      case "goals":
        return (
          <Goals
            navigate={navigate}
            goals={financeWorkspace.goals}
            onChange={updateGoals}
          />
        )
      case "learn":
        return <Learn navigate={navigate} courseProgress={courseProgress} />
      case "courseDetail":
        return currentCourse ? (
          <CourseDetail
            course={{
              ...currentCourse,
              progress:
                courseProgress[currentCourse.id] ?? currentCourse.progress,
            }}
            completedLessonIds={completedLessonIds}
            navigate={navigate}
          />
        ) : (
          <Navigate to={ROUTES.learn} replace />
        )
      case "lesson":
        return currentLesson ? (
          <Lesson lesson={currentLesson} navigate={navigate} />
        ) : (
          <Navigate to={ROUTES.learn} replace />
        )
      case "quiz":
        return (
          <Quiz
            navigate={navigate}
            onFinish={finishQuiz}
            nextLesson={
              currentLesson
                ? (courseModules.flatMap((module) => module.lessons)[
                    courseModules
                      .flatMap((module) => module.lessons)
                      .findIndex((lesson) => lesson.id === currentLesson.id) + 1
                  ] ?? null)
                : null
            }
          />
        )
      case "profile":
        return (
          <Profile
            navigate={navigate}
            user={profile}
            goals={financeWorkspace.goals}
            onLogout={handleLogout}
            courseProgress={courseProgress}
            theme={theme}
            onThemeChange={setTheme}
          />
        )
      case "personalData":
        return (
          <PersonalData
            user={profile}
            isFirstAccess={personalDataReturn === "home"}
            onBack={() => navigate(personalDataReturn)}
            onSave={async (updatedProfile) => {
              await api.patch("/profile", {
                name: updatedProfile.name,
                phone: updatedProfile.phone || null,
                monthlyIncomeCents: updatedProfile.monthlyIncome
                  ? toCents(Number(updatedProfile.monthlyIncome))
                  : null,
                financialGoal: updatedProfile.financialGoal || null,
              })
              await loadAuthenticatedData()
              navigate(personalDataReturn)
            }}
          />
        )
      case "financeSetup":
        if (!SETUP_SECTIONS.includes(setupSectionFromPath as SetupSection)) {
          return <Navigate to={ROUTES.finances} replace />
        }
        return (
          <FinanceSetup
            workspace={financeWorkspace}
            sources={financialSources}
            initialSection={financeSetupSection}
            onChange={updateFinanceWorkspace}
            onBack={() => navigate("finances")}
            onManageSources={() => navigate("financeOrganization")}
          />
        )
    }
  }

  const activeTab = SCREEN_TO_TAB[screen] ?? "home"
  const secured = (target: Screen) => {
    if (authStatus === "loading") {
      return (
        <div
          className="flex-1 bg-slate-50"
          role="status"
          aria-label="Verificando sessão"
        />
      )
    }
    if (authStatus !== "authenticated")
      return <Navigate to={ROUTES.auth} replace />
    if (
      [
        "home",
        "finances",
        "financeOrganization",
        "goals",
        "transaction",
      ].includes(target) &&
      !financeWorkspace.trackingStartDate
    ) {
      return <Navigate to={`${ROUTES.financeSetup}/balance`} replace />
    }
    return renderScreen(target)
  }

  return (
    <AppShell
      screen={screen}
      theme={theme}
      activeTab={activeTab}
      showNav={SCREENS_WITH_NAV.includes(screen)}
      onTabChange={handleTabChange}
    >
      <Suspense
        fallback={
          <div
            className="flex-1 bg-white"
            role="status"
            aria-label="Carregando tela"
          />
        }
      >
        <Routes>
          <Route
            path="/"
            element={
              authStatus === "authenticated" ? (
                <Navigate to={ROUTES.home} replace />
              ) : (
                renderScreen("onboarding")
              )
            }
          />
          <Route
            path={ROUTES.auth}
            element={
              authStatus === "authenticated" ? (
                <Navigate to={ROUTES.home} replace />
              ) : authStatus === "loading" ? (
                <div
                  className="flex-1 bg-slate-50"
                  role="status"
                  aria-label="Verificando sessão"
                />
              ) : (
                renderScreen("auth")
              )
            }
          />
          <Route path="/home" element={secured("home")} />
          <Route path="/finances" element={secured("finances")} />
          <Route
            path={ROUTES.financeOrganization}
            element={secured("financeOrganization")}
          />
          <Route
            path="/finances/transactions/:id"
            element={secured("transaction")}
          />
          <Route path="/goals" element={secured("goals")} />
          <Route path="/learn" element={secured("learn")} />
          <Route path="/learn/courses/:id" element={secured("courseDetail")} />
          <Route path="/learn/lessons/:id" element={secured("lesson")} />
          <Route path="/learn/quiz" element={secured("quiz")} />
          <Route path="/profile" element={secured("profile")} />
          <Route
            path="/profile/personal-data"
            element={secured("personalData")}
          />
          <Route
            path="/finances/setup/:section"
            element={secured("financeSetup")}
          />
          <Route
            path="*"
            element={<Navigate to={ROUTES.onboarding} replace />}
          />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
