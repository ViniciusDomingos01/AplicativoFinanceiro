/**
 * Charts.tsx — Componentes de gráficos do app
 *
 * Todos os gráficos usam a biblioteca Recharts com ResponsiveContainer
 * para se adaptar ao tamanho do container pai.
 *
 * Componentes exportados:
 * - `Sparkline`        — gráfico de linha simples em SVG puro (sem dependência)
 * - `MonthlyBarChart`  — gráfico de barras receitas × despesas (tela Finanças)
 * - `BalanceAreaChart` — gráfico de área da evolução do saldo (Dashboard)
 *
 * Paleta de cores:
 * - Receitas: #16a34a (verde)
 * - Despesas: #f87171 (vermelho suave)
 * - Área de saldo: #4ade80 sobre fundo escuro do header
 */

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

/**
 * Sparkline — Mini gráfico de linha em SVG puro
 *
 * Não usa Recharts; é um SVG calculado manualmente para ser leve e inline.
 * Ideal para uso dentro de cards pequenos onde a biblioteca seria overhead.
 *
 * @param data   - Array de valores numéricos para o eixo Y
 * @param color  - Cor da linha e do gradiente de área
 * @param height - Altura em pixels do SVG (padrão: 48)
 */
interface SparklineProps {
  data: number[]
  color?: string
  height?: number
}

export function Sparkline({ data, color = "#16a34a", height = 48 }: SparklineProps) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1 // evita divisão por zero se todos os valores forem iguais
  const w = 120
  const h = height
  const pad = 4 // margem interna para os pontos não ficarem cortados

  // Calcula coordenadas de cada ponto normalizando para o espaço do SVG
  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2)
      const y = h - pad - ((v - min) / range) * (h - pad * 2) // y inverte (SVG começa de cima)
      return `${x},${y}`
    })
    .join(" ")

  // Polígono fechado para a área preenchida sob a linha
  const areaPoints = `${pad},${h} ` + points + ` ${w - pad},${h}`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        {/* Gradiente vertical: cor sólida no topo → quase transparente embaixo */}
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Área preenchida com gradiente */}
      <polygon points={areaPoints} fill={`url(#grad-${color.replace("#", "")})`} />
      {/* Linha do gráfico */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * MonthlyBarChart — Gráfico de barras mensais (Receitas × Despesas)
 *
 * Exibido na tela de Finanças. Compara receitas (verde) e despesas (vermelho)
 * lado a lado para cada mês. Tooltip formatado em Real brasileiro.
 *
 * @param data - Array com `month`, `income` e `expenses` por período
 */
interface MonthlyBarChartProps {
  data: { month: string; income: number; expenses: number }[]
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barCategoryGap="28%" barGap={2}>
        {/* Grade horizontal pontilhada para guia visual */}
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

        {/* Eixo X com nomes dos meses */}
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "Inter" }}
        />

        {/* Eixo Y oculto — os valores aparecem no tooltip */}
        <YAxis hide />

        {/* Tooltip com fundo escuro e valores em Real */}
        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "none",
            borderRadius: 10,
            fontSize: 12,
            color: "#f8fafc",
            fontFamily: "Inter",
          }}
          formatter={(value) =>
            new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
          }
          cursor={{ fill: "#f8fafc", radius: 4 }}
        />

        {/* Legenda abaixo do gráfico */}
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, fontFamily: "Inter", paddingTop: 8 }}
        />

        {/* Barras com cantos arredondados no topo */}
        <Bar dataKey="income" name="Receitas" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Despesas" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * BalanceAreaChart — Gráfico de área da evolução do saldo
 *
 * Exibido no header do Dashboard (fundo verde escuro).
 * Usa gradiente e stroke claros para contraste sobre o fundo colorido.
 * Altura reduzida (120px) para caber no header sem ocupar muito espaço.
 *
 * @param data - Array com `month` e `income` (usado como proxy de evolução)
 */
interface BalanceAreaChartProps {
  data: { month: string; income: number; expenses: number }[]
}

export function BalanceAreaChart({ data }: BalanceAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data}>
        <defs>
          {/* Gradiente verde transparente para a área preenchida */}
          <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grade com cor branca suave para visibilidade sobre fundo escuro */}
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" vertical={false} />

        {/* Eixo X com texto claro para contraste */}
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.6)", fontFamily: "Inter" }}
        />

        <YAxis hide />

        {/* Tooltip com fundo escuro sólido */}
        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "none",
            borderRadius: 10,
            fontSize: 12,
            color: "#f8fafc",
            fontFamily: "Inter",
          }}
          formatter={(value) =>
            new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
          }
        />

        {/* Área da receita: linha verde clara + preenchimento com gradiente */}
        <Area
          type="monotone"
          dataKey="income"
          stroke="#4ade80"
          strokeWidth={2}
          fill="url(#balGrad)"
          dot={false} // sem pontos para visual mais limpo
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
