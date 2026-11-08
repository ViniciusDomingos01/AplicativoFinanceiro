import { lazy, Suspense, useState } from "react"
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
  SpendingCategory,
  Goal,
} from "./data/mockData"
import type { FinanceWorkspace, SetupSection } from "./screens/FinanceSetup"

const Onboarding = lazy(() => import("./screens/Onboarding"))
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

const TAB_SCREENS: Record<NavTab, Screen> = {
  home: "home",
  finances: "finances",
  learn: "learn",
  profile: "profile",
}

const SCREEN_TO_TAB: Partial<Record<Screen, NavTab>> = {
  home: "home",
  finances: "finances",
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
}

function recalculateCategoryPercentages(categories: SpendingCategory[]) {
  const total = categories.reduce((sum, category) => sum + category.amount, 0)
  return categories.map((category) => ({
    ...category,
    percentage: total > 0 ? Math.round((category.amount / total) * 100) : 0,
  }))
}

export default function App() {
  const location = useLocation()
  const routerNavigate = useNavigate()
  const screen = screenForPath(location.pathname) ?? "onboarding"
  const [profile, setProfile] = useState<UserProfile>(initialUser)
  const [personalDataReturn, setPersonalDataReturn] = useState<Screen>("home")
  const [financeWorkspace, setFinanceWorkspace] = useState<FinanceWorkspace>({
    balance: financialSummary.totalBalance,
    categories: spendingCategories,
    goals,
    transactions,
  })
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

  const routeId = routeIdFromPath(location.pathname)
  const routeEntity = (location.state as NavigationState | null)?.entity
  const transactionFromRoute = routeEntity as Transaction | undefined
  const courseFromRoute = routeEntity as Course | undefined
  const lessonFromRoute = routeEntity as LessonType | undefined

  const currentTransaction =
    (transactionFromRoute?.id === routeId ? transactionFromRoute : undefined) ??
    (selectedTransaction?.id === routeId ? selectedTransaction : undefined) ??
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

  function updateTransaction(previous: Transaction, next: Transaction) {
    setFinanceWorkspace((current) => {
      const signedAmount = (transaction: Transaction) =>
        transaction.type === "income" ? transaction.amount : -transaction.amount
      const changedCategories = current.categories.map((category) => {
        let amount = category.amount
        if (
          previous.type === "expense" &&
          category.name === previous.category
        ) {
          amount = Math.max(0, amount - previous.amount)
        }
        if (next.type === "expense" && category.name === next.category) {
          amount += next.amount
        }
        return { ...category, amount }
      })

      return {
        ...current,
        balance: current.balance + signedAmount(next) - signedAmount(previous),
        categories: recalculateCategoryPercentages(changedCategories),
        transactions: current.transactions.map((item) =>
          item.id === previous.id ? next : item,
        ),
      }
    })
    setSelectedTransaction(next)
  }

  function deleteTransaction(transaction: Transaction) {
    setFinanceWorkspace((current) => {
      const changedCategories = current.categories.map((category) => ({
        ...category,
        amount:
          transaction.type === "expense" &&
          category.name === transaction.category
            ? Math.max(0, category.amount - transaction.amount)
            : category.amount,
      }))
      return {
        ...current,
        balance:
          current.balance -
          (transaction.type === "income"
            ? transaction.amount
            : -transaction.amount),
        categories: recalculateCategoryPercentages(changedCategories),
        transactions: current.transactions.filter(
          (item) => item.id !== transaction.id,
        ),
      }
    })
    setSelectedTransaction(null)
    routerNavigate(ROUTES.finances)
  }

  function updateGoals(nextGoals: Goal[]) {
    setFinanceWorkspace((current) => ({ ...current, goals: nextGoals }))
  }

  function finishQuiz(result: { score: number; total: number; passed: boolean }) {
    const lessonId = currentLesson?.id
    if (!lessonId) return

    if (!rewardedLessonIds.includes(lessonId)) {
      setRewardedLessonIds((current) => [...current, lessonId])
      setProfile((current) => ({
        ...current,
        xp: current.xp + result.score * 10,
      }))
    }

    if (!result.passed || completedLessonIds.includes(lessonId)) return
    setCompletedLessonIds((current) => [...current, lessonId])
    const course = currentCourse ?? courses[0]
    if (!course) return
    const availableLessons = courseModules.flatMap((module) => module.lessons)
    const baselineCompletedIds = availableLessons
      .filter((lesson) => lesson.completed)
      .map((lesson) => lesson.id)
    const completionSlots = Math.max(
      1,
      availableLessons.length - baselineCompletedIds.length,
    )
    const completedDuringSession =
      completedLessonIds.filter((id) => !baselineCompletedIds.includes(id))
        .length + 1
    const baselineProgress = course.progress ?? 0
    const nextProgress = Math.min(
      100,
      baselineProgress +
        ((100 - baselineProgress) * completedDuringSession) / completionSlots,
    )
    setCourseProgress((current) => ({
      ...current,
      [course.id]: nextProgress,
    }))
  }

  function handleLogout() {
    setProfile(initialUser)
    setFinanceWorkspace({
      balance: financialSummary.totalBalance,
      categories: spendingCategories,
      goals,
      transactions,
    })
    setPersonalDataReturn("home")
    setSelectedTransaction(null)
    setSelectedCourse(null)
    setSelectedLesson(null)
    setCompletedLessonIds(
      courseModules.flatMap((module) =>
        module.lessons
          .filter((lesson) => lesson.completed)
          .map((lesson) => lesson.id),
      ),
    )
    setCourseProgress({})
    setRewardedLessonIds([])
    routerNavigate(ROUTES.onboarding)
  }

  function handleTabChange(tab: NavTab) {
    routerNavigate(ROUTES[TAB_SCREENS[tab]])
  }

  function renderScreen(target: Screen) {
    switch (target) {
      case "onboarding":
        return (
          <Onboarding
            onComplete={() => navigate("home")}
            onRegister={() => navigate("personalData")}
          />
        )
      case "home":
        return (
          <Home
            navigate={navigate}
            user={profile}
            workspace={financeWorkspace}
            courseProgress={courseProgress}
          />
        )
      case "finances":
        return <Finances navigate={navigate} workspace={financeWorkspace} />
      case "transaction":
        return currentTransaction ? (
          <TransactionDetail
            transaction={currentTransaction}
            categories={financeWorkspace.categories}
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
          />
        )
      case "personalData":
        return (
          <PersonalData
            user={profile}
            isFirstAccess={personalDataReturn === "home"}
            onBack={() => navigate(personalDataReturn)}
            onSave={(updatedProfile) => {
              setProfile(updatedProfile)
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
            initialSection={financeSetupSection}
            onChange={setFinanceWorkspace}
            onBack={() => navigate("finances")}
          />
        )
    }
  }

  const activeTab = SCREEN_TO_TAB[screen] ?? "home"

  return (
    <AppShell
      screen={screen}
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
          <Route path="/" element={renderScreen("onboarding")} />
          <Route path="/home" element={renderScreen("home")} />
          <Route path="/finances" element={renderScreen("finances")} />
          <Route
            path="/finances/transactions/:id"
            element={renderScreen("transaction")}
          />
          <Route path="/goals" element={renderScreen("goals")} />
          <Route path="/learn" element={renderScreen("learn")} />
          <Route
            path="/learn/courses/:id"
            element={renderScreen("courseDetail")}
          />
          <Route path="/learn/lessons/:id" element={renderScreen("lesson")} />
          <Route path="/learn/quiz" element={renderScreen("quiz")} />
          <Route path="/profile" element={renderScreen("profile")} />
          <Route
            path="/profile/personal-data"
            element={renderScreen("personalData")}
          />
          <Route
            path="/finances/setup/:section"
            element={renderScreen("financeSetup")}
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
