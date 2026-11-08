/**
 * mockData.ts — Dados simulados do app FinEduca
 *
 * Centraliza todos os dados de exemplo usados nas telas do protótipo.
 * Em produção, estes dados seriam substituídos por chamadas de API
 * (ex: REST, GraphQL ou Supabase).
 *
 * Estrutura dos dados:
 * - `user`               — informações do perfil do usuário logado
 * - `financialSummary`   — resumo financeiro do mês atual
 * - `monthlyData`        — evolução mensal de receitas e despesas (gráficos)
 * - `balanceHistory`     — histórico de saldo para sparkline
 * - `transactions`       — lista de transações recentes
 * - `spendingCategories` — categorias de gasto com percentuais
 * - `goals`              — metas financeiras do usuário
 * - `courses`            — catálogo de cursos disponíveis
 * - `courseModules`      — módulos e aulas de um curso específico (mock)
 * - `quizQuestions`      — questões para o quiz pós-aula
 * - `learnCategories`    — filtros de categoria na tela Aprender
 * - `articles`           — artigos de leitura rápida
 */

// ── Perfil do usuário ──────────────────────────────────────────────────────

export interface UserProfile {
  name: string
  email: string
  phone: string
  monthlyIncome: string
  financialGoal: string
  avatar: string
  level: string
  xp: number
  xpNext: number
  memberSince: string
}

export const user: UserProfile = {
  name: "Ana Souza",
  email: "ana.souza@email.com",
  phone: "(11) 99999-9999",
  monthlyIncome: "7200",
  financialGoal: "Criar uma reserva de emergência",
  avatar: "AS", // iniciais para o avatar gerado
  level: "Investidor Iniciante", // nível de progresso no app
  xp: 1240, // pontos de experiência acumulados
  xpNext: 2000, // XP necessário para o próximo nível
  memberSince: "Jan 2024",
}

// ── Resumo financeiro do mês ───────────────────────────────────────────────

export const financialSummary = {
  totalBalance: 18450.75, // saldo total consolidado (contas + investimentos)
  monthIncome: 7200.0, // total de receitas no mês atual
  monthExpenses: 3840.5, // total de despesas no mês atual
  totalInvested: 12300.0, // patrimônio total investido
  savingsRate: 47, // taxa de poupança em % (receita - despesas / receita)
}

// ── Dados para gráficos ────────────────────────────────────────────────────

/** Evolução mensal de receitas e despesas — usado no gráfico de barras */
export const monthlyData = [
  { month: "Mar", income: 6800, expenses: 4100 },
  { month: "Abr", income: 7000, expenses: 3900 },
  { month: "Mai", income: 6500, expenses: 4300 },
  { month: "Jun", income: 7200, expenses: 3600 },
  { month: "Jul", income: 7200, expenses: 3840 },
]

/** Histórico de saldo para sparkline no header do Dashboard */
export const balanceHistory = [12000, 13200, 11800, 14500, 15200, 16100, 18450]

// ── Transações ─────────────────────────────────────────────────────────────

/**
 * Tipo de uma transação financeira.
 * `amount` sempre positivo; o `type` define se é receita ou despesa.
 */
export interface Transaction {
  id: string
  categoryId?: string
  title: string
  amount: number // sempre positivo (ex: 420.30)
  type: "income" | "expense"
  category: string
  categoryColor: string // cor hex para ícones e badges
  date: string // formato ISO: "YYYY-MM-DD"
  paymentMethod: string
  note?: string // observação opcional
  icon: string // emoji representando a categoria
}

export const transactions: Transaction[] = [
  {
    id: "1",
    title: "Salário",
    amount: 7200.0,
    type: "income",
    category: "Renda",
    categoryColor: "#16a34a",
    date: "2025-07-01",
    paymentMethod: "Transferência",
    note: "Salário mensal",
    icon: "💼",
  },
  {
    id: "2",
    title: "Supermercado Extra",
    amount: 420.3,
    type: "expense",
    category: "Alimentação",
    categoryColor: "#f59e0b",
    date: "2025-07-03",
    paymentMethod: "Cartão de Débito",
    note: "Compras do mês",
    icon: "🛒",
  },
  {
    id: "3",
    title: "Netflix",
    amount: 55.9,
    type: "expense",
    category: "Lazer",
    categoryColor: "#dc2626",
    date: "2025-07-05",
    paymentMethod: "Cartão de Crédito",
    icon: "🎬",
  },
  {
    id: "4",
    title: "Farmácia",
    amount: 89.5,
    type: "expense",
    category: "Saúde",
    categoryColor: "#0891b2",
    date: "2025-07-06",
    paymentMethod: "PIX",
    icon: "💊",
  },
  {
    id: "5",
    title: "Freelance Design",
    amount: 1500.0,
    type: "income",
    category: "Renda Extra",
    categoryColor: "#7c3aed",
    date: "2025-07-08",
    paymentMethod: "PIX",
    note: "Projeto UI para cliente",
    icon: "🎨",
  },
  {
    id: "6",
    title: "Conta de Luz",
    amount: 187.4,
    type: "expense",
    category: "Casa",
    categoryColor: "#d97706",
    date: "2025-07-10",
    paymentMethod: "Boleto",
    icon: "⚡",
  },
  {
    id: "7",
    title: "Restaurante Outback",
    amount: 156.0,
    type: "expense",
    category: "Alimentação",
    categoryColor: "#f59e0b",
    date: "2025-07-12",
    paymentMethod: "Cartão de Crédito",
    icon: "🍽️",
  },
  {
    id: "8",
    title: "Tesouro Direto",
    amount: 500.0,
    type: "expense", // aporte registrado como saída do fluxo mensal
    category: "Investimento",
    categoryColor: "#16a34a",
    date: "2025-07-15",
    paymentMethod: "TED",
    note: "Aporte mensal Tesouro Selic",
    icon: "📈",
  },
]

// ── Categorias de gasto ────────────────────────────────────────────────────

/**
 * Resumo de gastos por categoria para o mês atual.
 * `percentage` representa a fatia do gasto total (0–100).
 */
export interface SpendingCategory {
  id?: string
  type?: "income" | "expense"
  name: string
  amount: number
  percentage: number
  color: string
  icon: string
}

export const spendingCategories: SpendingCategory[] = [
  {
    name: "Alimentação",
    amount: 576.3,
    percentage: 35,
    color: "#f59e0b",
    icon: "🍽️",
  },
  { name: "Casa", amount: 387.4, percentage: 24, color: "#d97706", icon: "🏠" },
  {
    name: "Lazer",
    amount: 255.9,
    percentage: 16,
    color: "#dc2626",
    icon: "🎮",
  },
  {
    name: "Saúde",
    amount: 189.5,
    percentage: 12,
    color: "#0891b2",
    icon: "💊",
  },
  {
    name: "Transporte",
    amount: 210.0,
    percentage: 13,
    color: "#7c3aed",
    icon: "🚗",
  },
]

// ── Metas financeiras ──────────────────────────────────────────────────────

/**
 * Tipo de uma meta financeira.
 * O progresso é calculado como `current / target * 100`.
 */
export interface Goal {
  id: string
  title: string
  icon: string // emoji temático da meta
  color: string // cor hex para barra de progresso e badges
  current: number // valor acumulado até agora
  target: number // valor objetivo da meta
  deadline: string // prazo no formato "Mês AAAA"
  deadlineDate?: string
}

export const goals: Goal[] = [
  {
    id: "1",
    title: "Reserva de Emergência",
    icon: "🛡️",
    color: "#16a34a",
    current: 12300,
    target: 21600, // equivale a 3 meses de despesas
    deadline: "Dez 2025",
  },
  {
    id: "2",
    title: "Notebook Novo",
    icon: "💻",
    color: "#2563eb",
    current: 1800,
    target: 4500,
    deadline: "Out 2025",
  },
  {
    id: "3",
    title: "Viagem à Europa",
    icon: "✈️",
    color: "#7c3aed",
    current: 3200,
    target: 15000,
    deadline: "Jul 2026",
  },
  {
    id: "4",
    title: "Entrada do Carro",
    icon: "🚗",
    color: "#d97706",
    current: 8500,
    target: 20000,
    deadline: "Mar 2026",
  },
]

// ── Cursos ─────────────────────────────────────────────────────────────────

/**
 * Tipo de um curso de educação financeira.
 * `progress` é undefined para cursos não iniciados.
 */
export interface Course {
  id: string
  title: string
  description: string
  category: string
  level: "Iniciante" | "Intermediário" | "Avançado"
  duration: string // ex: "4h 30min"
  lessons: number // total de aulas
  progress?: number // percentual concluído (undefined = não iniciado)
  rating: number // avaliação média (0–5)
  students: number // número de alunos matriculados
  isFree: boolean // se o curso é gratuito
  color: string // cor hex para temas visuais do curso
  emoji: string // emoji representando o tema do curso
}

export const courses: Course[] = [
  {
    id: "1",
    title: "Finanças Pessoais do Zero",
    description:
      "Aprenda a organizar seu dinheiro, criar um orçamento e sair das dívidas de uma vez por todas.",
    category: "Educação Financeira",
    level: "Iniciante",
    duration: "4h 30min",
    lessons: 18,
    progress: 65, // usuário já está na metade do curso
    rating: 4.9,
    students: 12400,
    isFree: false,
    color: "#16a34a",
    emoji: "💰",
  },
  {
    id: "2",
    title: "Introdução aos Investimentos",
    description:
      "Entenda os conceitos básicos de investimentos, perfil de investidor e como começar a investir.",
    category: "Investimentos",
    level: "Iniciante",
    duration: "3h 15min",
    lessons: 14,
    progress: 30,
    rating: 4.8,
    students: 8700,
    isFree: true,
    color: "#2563eb",
    emoji: "📊",
  },
  {
    id: "3",
    title: "Tesouro Direto na Prática",
    description:
      "Passo a passo para comprar seus primeiros títulos do Tesouro Direto com segurança.",
    category: "Renda Fixa",
    level: "Iniciante",
    duration: "2h 45min",
    lessons: 10,
    rating: 4.7,
    students: 5200,
    isFree: false,
    color: "#d97706",
    emoji: "🏦",
  },
  {
    id: "4",
    title: "FIIs: Fundos Imobiliários",
    description:
      "Como analisar e investir em fundos imobiliários para renda passiva mensal.",
    category: "Fundos Imobiliários",
    level: "Intermediário",
    duration: "5h 20min",
    lessons: 22,
    rating: 4.9,
    students: 6800,
    isFree: false,
    color: "#7c3aed",
    emoji: "🏢",
  },
  {
    id: "5",
    title: "Planejamento Financeiro",
    description:
      "Monte seu plano financeiro para os próximos 5 anos e alcance a liberdade financeira.",
    category: "Planejamento",
    level: "Intermediário",
    duration: "3h 50min",
    lessons: 16,
    rating: 4.8,
    students: 4300,
    isFree: false,
    color: "#0891b2",
    emoji: "🎯",
  },
  {
    id: "6",
    title: "Introdução à Bolsa de Valores",
    description:
      "Entenda como funciona a bolsa, o que são ações e como analisar empresas.",
    category: "Ações",
    level: "Iniciante",
    duration: "6h 10min",
    lessons: 24,
    rating: 4.6,
    students: 9100,
    isFree: true,
    color: "#dc2626",
    emoji: "📈",
  },
]

// ── Módulos e aulas ────────────────────────────────────────────────────────

/**
 * Tipo de uma aula dentro de um módulo.
 * `type` define o ícone e o comportamento ao clicar.
 */
export interface Lesson {
  id: string
  title: string
  duration: string // ex: "8min"
  completed: boolean // se o usuário já leu/completou
  type: "text" | "quiz"
}

/** Tipo de um módulo agrupando várias aulas */
export interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

/**
 * Estrutura de módulos do curso "Finanças Pessoais do Zero".
 * Usada como mock para a tela CourseDetail e para navegação sequencial em Lesson.
 */
export const courseModules: Module[] = [
  {
    id: "m1",
    title: "Módulo 1: Diagnóstico Financeiro",
    lessons: [
      {
        id: "l1",
        title: "Por onde começo?",
        duration: "8min",
        completed: true,
        type: "text",
      },
      {
        id: "l2",
        title: "Calculando sua situação atual",
        duration: "12min",
        completed: true,
        type: "text",
      },
      {
        id: "l3",
        title: "Quiz: Diagnóstico",
        duration: "5min",
        completed: true,
        type: "quiz",
      },
    ],
  },
  {
    id: "m2",
    title: "Módulo 2: Orçamento Inteligente",
    lessons: [
      {
        id: "l4",
        title: "A regra 50/30/20",
        duration: "15min",
        completed: true,
        type: "text",
      },
      {
        id: "l5",
        title: "Criando seu orçamento pessoal",
        duration: "18min",
        completed: false,
        type: "text",
      }, // próxima aula do usuário
      {
        id: "l6",
        title: "Ferramentas de controle",
        duration: "10min",
        completed: false,
        type: "text",
      },
      {
        id: "l7",
        title: "Quiz: Orçamento",
        duration: "5min",
        completed: false,
        type: "quiz",
      },
    ],
  },
  {
    id: "m3",
    title: "Módulo 3: Eliminando Dívidas",
    lessons: [
      {
        id: "l8",
        title: "Tipos de dívidas e juros",
        duration: "14min",
        completed: false,
        type: "text",
      },
      {
        id: "l9",
        title: "Estratégias para quitar dívidas",
        duration: "20min",
        completed: false,
        type: "text",
      },
      {
        id: "l10",
        title: "Negociação com credores",
        duration: "12min",
        completed: false,
        type: "text",
      },
    ],
  },
]

// ── Quiz ───────────────────────────────────────────────────────────────────

/**
 * Questões de múltipla escolha para o quiz pós-aula.
 * `correct` é o índice da alternativa correta no array `options` (0-based).
 */
export const quizQuestions = [
  {
    id: 1,
    question:
      "Qual é a principal recomendação da regra 50/30/20 para gastos com necessidades?",
    options: ["30% da renda", "50% da renda", "20% da renda", "70% da renda"],
    correct: 1,
    explanation:
      "A regra 50/30/20 recomenda que 50% da renda seja destinada a necessidades básicas.",
  },
  {
    id: 2,
    question: "O que é uma reserva de emergência?",
    options: [
      "Dinheiro para investir na bolsa",
      "Valor guardado para imprevistos",
      "Fundo para aposentadoria",
      "Limite do cartão de crédito",
    ],
    correct: 1,
    explanation:
      "A reserva de emergência é um valor guardado para cobrir imprevistos sem comprometer seu planejamento.",
  },
  {
    id: 3,
    question: "Qual dessas opções representa uma dívida considerada 'boa'?",
    options: [
      "Crédito rotativo do cartão",
      "Cheque especial",
      "Financiamento imobiliário",
      "Empréstimo pessoal de alta taxa",
    ],
    correct: 2,
    explanation:
      "O financiamento imobiliário tem juros menores e financia um bem que pode se valorizar.",
  },
]

// ── Categorias da tela Aprender ────────────────────────────────────────────

/**
 * Filtros de categoria exibidos em scroll horizontal na tela Aprender.
 * O primeiro item ("Todos") funciona como reset do filtro.
 */
export const learnCategories = [
  { name: "Todos", icon: "🌟", active: true },
  { name: "Educação", icon: "📚" },
  { name: "Investimentos", icon: "📊" },
  { name: "Renda Fixa", icon: "🏦" },
  { name: "FIIs", icon: "🏢" },
  { name: "Ações", icon: "📈" },
  { name: "Planejamento", icon: "🎯" },
  { name: "Economia", icon: "💡" },
]

// ── Artigos rápidos ────────────────────────────────────────────────────────

/** Artigos de leitura curta exibidos na tela Aprender */
export const articles = [
  {
    id: "a1",
    title: "Como a inflação afeta seus investimentos em 2025",
    readTime: "4 min",
    category: "Economia",
    emoji: "📰",
    color: "#0891b2",
  },
  {
    id: "a2",
    title: "Tesouro Selic ou CDB: qual escolher agora?",
    readTime: "6 min",
    category: "Renda Fixa",
    emoji: "🏦",
    color: "#d97706",
  },
  {
    id: "a3",
    title: "7 hábitos de quem tem sucesso financeiro",
    readTime: "5 min",
    category: "Educação",
    emoji: "✨",
    color: "#16a34a",
  },
]
