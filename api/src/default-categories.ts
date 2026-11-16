import { TransactionType } from "../generated/prisma/enums.js"

export const DEFAULT_CATEGORIES = [
  { name: "Salário", type: TransactionType.INCOME, color: "#16a34a", icon: "💼" },
  { name: "Renda extra", type: TransactionType.INCOME, color: "#0891b2", icon: "✨" },
  { name: "Vendas", type: TransactionType.INCOME, color: "#7c3aed", icon: "🛍️" },
  { name: "Outras receitas", type: TransactionType.INCOME, color: "#059669", icon: "＋" },
  { name: "Moradia", type: TransactionType.EXPENSE, color: "#2563eb", icon: "🏠" },
  { name: "Alimentação", type: TransactionType.EXPENSE, color: "#d97706", icon: "🍽️" },
  { name: "Transporte", type: TransactionType.EXPENSE, color: "#7c3aed", icon: "🚗" },
  { name: "Saúde", type: TransactionType.EXPENSE, color: "#0891b2", icon: "💊" },
  { name: "Educação", type: TransactionType.EXPENSE, color: "#0f766e", icon: "📚" },
  { name: "Lazer", type: TransactionType.EXPENSE, color: "#dc2626", icon: "🎭" },
  { name: "Contas e serviços", type: TransactionType.EXPENSE, color: "#475569", icon: "🧾" },
  { name: "Outras despesas", type: TransactionType.EXPENSE, color: "#64748b", icon: "•" },
] as const
