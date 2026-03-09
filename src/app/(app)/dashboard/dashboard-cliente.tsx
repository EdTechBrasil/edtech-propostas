'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/format'
import {
  FilePlus, FileText, Clock, CheckCircle2, BarChart3, Search,
} from 'lucide-react'

type Proposta = {
  id: string
  orcamento_alvo: number
  status: string
  criado_em: string
  cliente_nome_instituicao: string | null
  criador_nome: string
  perfil_atual: string
}

function linkProposta(id: string, status: string) {
  if (status === 'Aguardando_aprovacao' || status === 'Aprovada_excecao' || status === 'Pronta_pdf') {
    return `/proposta/${id}/revisao`
  }
  if (status === 'Em_revisao') {
    return `/proposta/${id}/cliente`
  }
  return `/proposta/${id}/publico`
}

function formatDataCurta(criado_em: string) {
  const d = new Date(criado_em)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

// ── Cards de resumo ───────────────────────────────────────────────────────────

function SummaryCard({
  iconBg,
  icon,
  label,
  value,
  badge,
}: {
  iconBg: string
  icon: React.ReactNode
  label: string
  value: string
  badge?: { text: string; positive: boolean } | null
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconBg}`}>
          {icon}
        </div>
        {badge && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            badge.positive ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'
          }`}>
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

// ── Gráfico de barras mensal ──────────────────────────────────────────────────

function BarChartMensal({ propostas }: { propostas: Proposta[] }) {
  const hoje = new Date()
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + i, 1)
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      isCurrent: i === 5,
    }
  })

  const data = meses.map(m => ({
    ...m,
    valor: propostas
      .filter(p => p.status !== 'Cancelada' && p.criado_em.startsWith(m.key))
      .reduce((sum, p) => sum + p.orcamento_alvo, 0),
  }))

  const maxVal = Math.max(...data.map(d => d.valor), 1)
  const ticks = [1, 0.75, 0.5, 0.25, 0]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-6">Desempenho Mensal</h2>
      <div className="flex gap-4">
        {/* Y-axis */}
        <div className="flex flex-col justify-between text-right" style={{ height: 160 }}>
          {ticks.map(t => {
            const v = maxVal * t
            return (
              <span key={t} className="text-[10px] text-slate-400 leading-none">
                {v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}
              </span>
            )
          })}
        </div>
        {/* Bars */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {data.map(d => (
              <div key={d.key} className="flex-1 flex items-end h-full">
                <div
                  title={formatCurrency(d.valor)}
                  className={`w-full rounded-t-md transition-all ${d.isCurrent ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  style={{ height: `${Math.max((d.valor / maxVal) * 100, 2)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {data.map(d => (
              <div key={d.key} className="flex-1 text-center text-[11px] text-slate-500 capitalize">
                {d.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Atividade recente ─────────────────────────────────────────────────────────

function AtividadeRecente({ propostas }: { propostas: Proposta[] }) {
  const recentes = [...propostas]
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
    .slice(0, 5)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-900">Atividade Recente</h2>
        <Link
          href="/propostas"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          Ver todas
        </Link>
      </div>
      {recentes.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">Nenhuma proposta ainda</p>
      ) : (
        <div className="space-y-1">
          {recentes.map(p => (
            <Link
              key={p.id}
              href={linkProposta(p.id, p.status)}
              className="flex items-center gap-3 -mx-2 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 flex-shrink-0">
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {p.cliente_nome_instituicao || <span className="text-slate-400 italic text-xs">Sem dados</span>}
                </p>
                <p className="text-xs text-slate-400 font-mono">{p.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(p.orcamento_alvo)}</p>
                <p className="text-xs text-slate-400">{formatDataCurta(p.criado_em)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function DashboardCliente({
  propostas,
}: {
  propostas: Proposta[]
}) {
  // Stats para summary cards
  const volumeTotal = propostas
    .filter(p => p.status !== 'Cancelada')
    .reduce((s, p) => s + p.orcamento_alvo, 0)
  const aprovadas = propostas.filter(p => p.status === 'Pronta_pdf' || p.status === 'Aprovada_excecao').length
  const aguardando = propostas.filter(p => p.status === 'Aguardando_aprovacao').length

  // Badge de variação mensal
  const hoje = new Date()
  const mesAtualKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
  const mesAnteriorKey = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`
  const volAtual = propostas
    .filter(p => p.status !== 'Cancelada' && p.criado_em.startsWith(mesAtualKey))
    .reduce((s, p) => s + p.orcamento_alvo, 0)
  const volAnterior = propostas
    .filter(p => p.status !== 'Cancelada' && p.criado_em.startsWith(mesAnteriorKey))
    .reduce((s, p) => s + p.orcamento_alvo, 0)
  const volumeBadge = volAnterior > 0 ? {
    text: `${volAtual >= volAnterior ? '+' : ''}${Math.round(((volAtual - volAnterior) / volAnterior) * 100)}%`,
    positive: volAtual >= volAnterior,
  } : null

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex-1">Visão Geral</h1>
        <Link href="/propostas">
          <Button variant="outline" size="sm" className="gap-2">
            <Search className="w-4 h-4" />
            Buscar propostas
          </Button>
        </Link>
        <Link href="/proposta/nova">
          <Button className="gap-2">
            <FilePlus className="w-4 h-4" />
            Nova Proposta
          </Button>
        </Link>
      </div>

      {/* 3 cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          iconBg="bg-indigo-100"
          icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
          label="Volume Total"
          value={formatCurrency(volumeTotal)}
          badge={volumeBadge}
        />
        <SummaryCard
          iconBg="bg-emerald-100"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          label="Propostas Aprovadas"
          value={String(aprovadas)}
        />
        <SummaryCard
          iconBg="bg-orange-100"
          icon={<Clock className="w-5 h-5 text-orange-500" />}
          label="Aguardando Resposta"
          value={String(aguardando)}
        />
      </div>

      {/* Gráfico + Atividade recente */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <BarChartMensal propostas={propostas} />
        <AtividadeRecente propostas={propostas} />
      </div>
    </div>
  )
}
