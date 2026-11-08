import { useState, type FormEvent } from "react"
import { ArrowLeft, Check, Target, UserRound } from "lucide-react"
import type { UserProfile } from "../data/mockData"

interface PersonalDataProps {
  user: UserProfile
  isFirstAccess: boolean
  onBack: () => void
  onSave: (user: UserProfile) => void
}

const goals = [
  "Criar uma reserva de emergência",
  "Sair das dívidas",
  "Começar a investir",
  "Comprar um imóvel",
  "Planejar a aposentadoria",
]

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export default function PersonalData({
  user,
  isFirstAccess,
  onBack,
  onSave,
}: PersonalDataProps) {
  const [form, setForm] = useState(user)

  function update(field: keyof UserProfile, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({ ...form, avatar: initials(form.name) || "FE" })
  }

  const fieldClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-5 pt-14 pb-6 bg-gradient-to-br from-emerald-700 via-green-600 to-teal-600 text-white">
        <div className="flex items-center gap-3 mb-5">
          {!isFirstAccess && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <p className="text-green-100 text-xs font-medium">
              {isFirstAccess ? "Só mais um passo" : "Sua conta"}
            </p>
            <h2 className="font-display text-xl font-bold">
              {isFirstAccess ? "Vamos personalizar o FinEduca" : "Dados pessoais"}
            </h2>
          </div>
        </div>
        <p className="text-sm text-white/75 leading-relaxed">
          Essas informações ajudam a adaptar os conteúdos e o planejamento financeiro ao seu momento.
        </p>
      </div>

      <form onSubmit={submit} className="phone-scroll flex-1 overflow-y-auto px-4 py-5 pb-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-2 pb-1">
            <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <UserRound size={17} />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">Sobre você</h3>
              <p className="text-[10px] text-slate-400">Você poderá editar estes dados depois.</p>
            </div>
          </div>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1.5">Nome completo</span>
            <input
              required
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              className={fieldClass}
              placeholder="Como podemos chamar você?"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1.5">E-mail</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              className={fieldClass}
              placeholder="voce@email.com"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">Telefone</span>
              <input
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                className={fieldClass}
                placeholder="(00) 00000-0000"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">Renda mensal</span>
              <input
                inputMode="decimal"
                value={form.monthlyIncome}
                onChange={(event) => update("monthlyIncome", event.target.value)}
                className={fieldClass}
                placeholder="R$ 0,00"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Target size={17} />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">Objetivo principal</h3>
              <p className="text-[10px] text-slate-400">Escolha o foco da sua jornada.</p>
            </div>
          </div>
          <div className="space-y-2">
            {goals.map((goal) => {
              const selected = form.financialGoal === goal
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => update("financialGoal", goal)}
                  className={`w-full flex items-center justify-between rounded-2xl border px-3.5 py-3 text-left text-xs font-medium transition ${
                    selected
                      ? "border-green-500 bg-green-50 text-green-800"
                      : "border-slate-100 text-slate-600"
                  }`}
                >
                  {goal}
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      selected ? "bg-green-600 text-white" : "border border-slate-200"
                    }`}
                  >
                    {selected && <Check size={12} />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-5 py-4 rounded-2xl bg-green-600 text-white font-display font-bold text-sm shadow-lg shadow-green-600/20 active:scale-[0.98] transition"
        >
          {isFirstAccess ? "Criar meu perfil" : "Salvar alterações"}
        </button>
        <p className="text-center text-[10px] text-slate-400 mt-3 px-4">
          Seus dados são usados apenas para personalizar sua experiência neste protótipo.
        </p>
      </form>
    </div>
  )
}
