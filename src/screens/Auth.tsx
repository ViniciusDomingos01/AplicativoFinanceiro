import { useState, type FormEvent } from "react"
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react"
import { api } from "../api/client"
import { PrimaryButton } from "../components/UI"

interface AuthProps {
  initialMode: "login" | "register"
  onAuthenticated: () => Promise<void>
  onBack: () => void
}

export default function Auth({
  initialMode,
  onAuthenticated,
  onBack,
}: AuthProps) {
  const [mode, setMode] = useState(initialMode)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setBusy(true)
    try {
      if (mode === "register") {
        await api.post("/auth/register", { name, email, password })
      } else {
        await api.post("/auth/login", { email, password })
      }
      await onAuthenticated()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível entrar agora.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="phone-scroll flex-1 overflow-y-auto bg-slate-50 px-6 pt-16 pb-10">
      <button
        type="button"
        onClick={onBack}
        aria-label="Voltar ao início"
        className="mb-8 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
      >
        <ArrowLeft size={19} />
      </button>

      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <LockKeyhole size={26} />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          FinEduca
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === "register" ? "Crie sua conta" : "Que bom ter você de volta"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Seus registros financeiros ficam privados e separados dos dados de
          demonstração.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {mode === "register" && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">
              Nome
            </span>
            <span className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-emerald-500">
              <UserRound
                size={17}
                className="text-slate-400"
                aria-hidden="true"
              />
              <input
                autoComplete="name"
                required
                minLength={2}
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </span>
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">
            E-mail
          </span>
          <span className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-emerald-500">
            <Mail size={17} className="text-slate-400" aria-hidden="true" />
            <input
              autoComplete="email"
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">
            Senha
          </span>
          <span className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-emerald-500">
            <LockKeyhole
              size={17}
              className="text-slate-400"
              aria-hidden="true"
            />
            <input
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              type={showPassword ? "text" : "password"}
              required
              minLength={12}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="text-slate-400"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
          {mode === "register" && (
            <span className="mt-1 block text-[11px] text-slate-400">
              Use ao menos 12 caracteres.
            </span>
          )}
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <PrimaryButton
          type="submit"
          disabled={busy}
          className="w-full justify-center"
        >
          {busy ? "Aguarde…" : mode === "register" ? "Criar conta" : "Entrar"}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {mode === "register" ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
        <button
          type="button"
          onClick={() => {
            setError("")
            setMode((current) =>
              current === "register" ? "login" : "register",
            )
          }}
          className="font-semibold text-emerald-700"
        >
          {mode === "register" ? "Entrar" : "Cadastre-se"}
        </button>
      </p>
    </div>
  )
}
