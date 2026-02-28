import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { formatCurrency, formatPercent } from '@/utils/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp, FileText, CheckCircle2, Clock,
  XCircle, BarChart3, DollarSign, Percent,
} from 'lucide-react'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  Rascunho:             { label: 'Rascunho',           className: 'bg-slate-100 text-slate-600' },
  Em_revisao:           { label: 'Em revisão',         className: 'bg-blue-100 text-blue-700' },
  Aguardando_aprovacao: { label: 'Aguard. aprovação',  className: 'bg-yellow-100 text-yellow-700' },
  Aprovada_excecao:     { label: 'Aprovada (exceção)', className: 'bg-purple-100 text-purple-700' },
  Pronta_pdf:           { label: 'Pronta',             className: 'bg-green-100 text-green-700' },
  Cancelada:            { label: 'Cancelada',          className: 'bg-red-100 text-red-600' },
}

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single<{ perfil: string }>()

  if (!usuario || (usuario.perfil !== 'Gestor' && usuario.perfil !== 'ADM')) {
    notFound()
  }

  const [{ data: propostas }, { data: financeiros }] = await Promise.all([
    supabase
      .from('propostas')
      .select(`
        id, status, orcamento_alvo, criado_em,
        cliente_nome_instituicao,
        criador:usuarios!criado_por_usuario_id(nome)
      `)
      .order('criado_em', { ascending: false }),
    supabase
      .from('proposta_financeiro')
      .select('proposta_id, receita_bruta, receita_liquida, margem_percent'),
  ])

  const todas = propostas ?? []
  const ativas = todas.filter(p => p.status !== 'Cancelada')

  // Métricas gerais
  const total = todas.length
  const prontas = todas.filter(p => p.status === 'Pronta_pdf').length
  const aguardando = todas.filter(p => p.status === 'Aguardando_aprovacao').length
  const canceladas = todas.filter(p => p.status === 'Cancelada').length
  const taxaConversao = total > 0 ? (prontas / total) * 100 : 0

  // Financeiro agregado (somente propostas ativas com dados financeiros)
  const fin = financeiros ?? []
  const finAtivas = fin.filter(f =>
    ativas.some(p => p.id === f.proposta_id)
  )
  const receitaBrutaTotal = finAtivas.reduce((a, f) => a + (f.receita_bruta ?? 0), 0)
  const receitaLiquidaTotal = finAtivas.reduce((a, f) => a + (f.receita_liquida ?? 0), 0)
  const margemMedia = finAtivas.length > 0
    ? finAtivas.reduce((a, f) => a + (f.margem_percent ?? 0), 0) / finAtivas.length
    : 0

  // Breakdown por status
  const statusKeys = ['Rascunho', 'Em_revisao', 'Aguardando_aprovacao', 'Aprovada_excecao', 'Pronta_pdf', 'Cancelada']
  const breakdownStatus = statusKeys.map(status => {
    const grupo = todas.filter(p => p.status === status)
    const valorTotal = grupo.reduce((a, p) => a + (p.orcamento_alvo ?? 0), 0)
    return { status, count: grupo.length, valorTotal }
  })

  // Top 5 propostas por valor (ativas)
  const top5 = [...ativas]
    .sort((a, b) => (b.orcamento_alvo ?? 0) - (a.orcamento_alvo ?? 0))
    .slice(0, 5)

  // Evolução mensal (últimos 6 meses) — contagem e valor
  const hoje = new Date()
  const meses: { key: string; label: string; count: number; valor: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const ano = d.getFullYear()
    const mes = d.getMonth()
    const label = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
    const grupo = todas.filter(p => {
      const pd = new Date(p.criado_em)
      return pd.getFullYear() === ano && pd.getMonth() === mes
    })
    meses.push({
      key: `${ano}-${mes}`,
      label,
      count: grupo.length,
      valor: grupo.reduce((a, p) => a + (p.orcamento_alvo ?? 0), 0),
    })
  }

  const maxMesCount = Math.max(...meses.map(m => m.count), 1)

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 className="w-6 h-6 text-slate-700" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-slate-500 text-sm mt-0.5">Visão geral do pipeline de propostas</p>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total de propostas"
          value={String(total)}
          sub={`${ativas.length} ativas`}
          icon={<FileText className="w-5 h-5 text-slate-500" />}
        />
        <MetricCard
          label="Propostas prontas"
          value={String(prontas)}
          sub={`${taxaConversao.toFixed(0)}% de conversão`}
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          highlight="green"
        />
        <MetricCard
          label="Aguardando aprovação"
          value={String(aguardando)}
          sub={aguardando > 0 ? 'Requer atenção' : 'Tudo em dia'}
          icon={<Clock className="w-5 h-5 text-yellow-500" />}
          highlight={aguardando > 0 ? 'yellow' : undefined}
        />
        <MetricCard
          label="Canceladas"
          value={String(canceladas)}
          sub={`${total > 0 ? ((canceladas / total) * 100).toFixed(0) : 0}% do total`}
          icon={<XCircle className="w-5 h-5 text-red-400" />}
        />
      </div>

      {/* Cards financeiros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <MetricCard
          label="Receita bruta (ativas)"
          value={formatCurrency(receitaBrutaTotal)}
          sub={`${finAtivas.length} propostas com dados`}
          icon={<DollarSign className="w-5 h-5 text-blue-500" />}
          large
        />
        <MetricCard
          label="Receita líquida (ativas)"
          value={formatCurrency(receitaLiquidaTotal)}
          sub="Após descontos"
          icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
          large
        />
        <MetricCard
          label="Margem média"
          value={formatPercent(margemMedia)}
          sub="Propostas com dados financeiros"
          icon={<Percent className="w-5 h-5 text-purple-500" />}
          large
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolução mensal */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Propostas por mês (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {meses.map(m => (
                <div key={m.key} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-14 shrink-0 capitalize">{m.label}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div
                      className="h-5 rounded bg-blue-200 transition-all"
                      style={{ width: `${(m.count / maxMesCount) * 100}%`, minWidth: m.count > 0 ? '8px' : '0' }}
                    />
                    <span className="text-xs text-slate-600 shrink-0">
                      {m.count} {m.count !== 1 ? 'propostas' : 'proposta'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 w-24 text-right">
                    {formatCurrency(m.valor)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Breakdown por status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Por status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {breakdownStatus.map(({ status, count, valorTotal }) => {
                const cfg = STATUS_LABEL[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' }
                return (
                  <div key={status} className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                      {cfg.label}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-800">{count}</span>
                      {valorTotal > 0 && (
                        <p className="text-xs text-slate-400">{formatCurrency(valorTotal)}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 propostas */}
      {top5.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top 5 propostas por orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="text-left pb-2 font-medium">Cliente</th>
                  <th className="text-left pb-2 font-medium">Criador</th>
                  <th className="text-center pb-2 font-medium">Status</th>
                  <th className="text-right pb-2 font-medium">Orçamento alvo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {top5.map((p: any) => {
                  const cfg = STATUS_LABEL[p.status] ?? { label: p.status, className: 'bg-slate-100 text-slate-600' }
                  return (
                    <tr key={p.id}>
                      <td className="py-2 text-slate-800">
                        {p.cliente_nome_instituicao || <span className="text-slate-400 italic">Sem cliente</span>}
                        <span className="ml-2 font-mono text-xs text-slate-300">#{p.id.slice(0, 6)}</span>
                      </td>
                      <td className="py-2 text-slate-500">{(p as any).criador?.nome ?? '—'}</td>
                      <td className="py-2 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-800">
                        {formatCurrency(p.orcamento_alvo)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MetricCard({
  label, value, sub, icon, highlight, large,
}: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  highlight?: 'green' | 'yellow'
  large?: boolean
}) {
  const bg = highlight === 'green'
    ? 'bg-green-50 border-green-200'
    : highlight === 'yellow'
    ? 'bg-yellow-50 border-yellow-200'
    : 'bg-white'

  return (
    <div className={`rounded-xl border p-5 ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        {icon}
      </div>
      <p className={`font-bold text-slate-900 ${large ? 'text-2xl' : 'text-3xl'}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  )
}
