import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent, margemBgColor } from '@/utils/format'
import { AprovacaoBtns } from './aprovacao-btns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default async function AprovacaoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Só Gestor e ADM
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single<{ perfil: string }>()

  if (!usuario || (usuario.perfil !== 'Gestor' && usuario.perfil !== 'ADM')) {
    notFound()
  }

  const [
    { data: proposta },
    { data: financeiro },
    { data: aprovacao },
    { data: produtos },
  ] = await Promise.all([
    supabase
      .from('propostas')
      .select(`
        id, status, orcamento_alvo, limite_orcamento_max,
        publico_descricao, repasse_tipo, repasse_valor,
        cliente_nome_instituicao, cliente_cidade, validade_proposta,
        criado_em,
        criador:usuarios!criado_por_usuario_id(nome)
      `)
      .eq('id', id)
      .single<any>(),
    supabase
      .from('proposta_financeiro')
      .select('*')
      .eq('proposta_id', id)
      .single<{
        receita_bruta: number
        total_descontos: number
        receita_liquida: number
        custo_produtos: number
        custo_servicos: number
        repasse_valor_calculado: number
        custo_total: number
        lucro_bruto: number
        margem_percent: number
      }>(),
    supabase
      .from('aprovacao_excecao_margem')
      .select('margem_minima_percent, margem_calculada_percent, criado_em, solicitante:usuarios!solicitado_por_usuario_id(nome)')
      .eq('proposta_id', id)
      .is('aprovado_em', null)
      .single<any>(),
    supabase
      .from('proposta_produtos')
      .select(`
        id,
        produto:produtos(nome),
        componentes:proposta_componentes(
          id, quantidade, valor_venda_unit, custo_interno_unit, obrigatorio,
          componente:produto_componentes(nome, categoria)
        ),
        servicos:proposta_servicos(
          id, quantidade, valor_venda_unit, custo_interno_unit,
          servico:produto_servicos(nome)
        )
      `)
      .eq('proposta_id', id),
  ])

  if (!proposta || proposta.status !== 'Aguardando_aprovacao') {
    notFound()
  }

  const margem = financeiro?.margem_percent ?? aprovacao?.margem_calculada_percent ?? 0
  const margem_minima = aprovacao?.margem_minima_percent ?? 12
  const diferenca = margem - margem_minima

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/aprovacao">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Análise de Aprovação</h1>
          <p className="text-slate-500 mt-0.5">
            {proposta.cliente_nome_instituicao || 'Sem dados do cliente'}
            {' · '}Solicitado por <strong>{aprovacao?.solicitante?.nome ?? '—'}</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="col-span-2 space-y-6">

          {/* Alerta de margem */}
          <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Margem abaixo do mínimo</p>
              <p className="text-sm text-red-600 mt-0.5">
                Margem calculada: <strong>{formatPercent(margem)}</strong>
                {' '} — mínimo exigido: <strong>{formatPercent(margem_minima)}</strong>
                {' '} — diferença: <strong>{formatPercent(Math.abs(diferenca))} abaixo</strong>
              </p>
            </div>
          </div>

          {/* Resumo financeiro */}
          {financeiro && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Resumo financeiro</CardTitle>
                  <span className={`text-xl font-bold px-3 py-1 rounded-lg ${margemBgColor(margem)}`}>
                    {formatPercent(margem)} margem
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <Row label="Receita bruta" value={formatCurrency(financeiro.receita_bruta)} />
                  <Row label="(-) Descontos" value={`-${formatCurrency(financeiro.total_descontos)}`} muted />
                  <div className="border-t my-2" />
                  <Row label="Receita líquida" value={formatCurrency(financeiro.receita_liquida)} bold />
                  <div className="border-t my-2" />
                  <Row label="Custo produtos" value={`-${formatCurrency(financeiro.custo_produtos)}`} muted />
                  <Row label="Custo serviços" value={`-${formatCurrency(financeiro.custo_servicos)}`} muted />
                  <Row label="Repasse parceiro" value={`-${formatCurrency(financeiro.repasse_valor_calculado)}`} muted />
                  <Row label="Custo total" value={`-${formatCurrency(financeiro.custo_total)}`} />
                  <div className="border-t my-2" />
                  <Row label="Lucro bruto" value={formatCurrency(financeiro.lucro_bruto)} bold />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Produtos e componentes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Composição da proposta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {(produtos ?? []).length === 0 ? (
                <p className="text-sm text-slate-400 italic">Nenhum produto</p>
              ) : (
                (produtos ?? []).map((pp: any) => (
                  <div key={pp.id}>
                    <p className="font-semibold text-slate-800 mb-2">{pp.produto?.nome}</p>
                    <div className="rounded-lg border border-slate-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-xs text-slate-400 border-b border-slate-100">
                            <th className="text-left px-3 py-1.5 font-medium">Item</th>
                            <th className="text-center px-3 py-1.5 font-medium">Qtd</th>
                            <th className="text-right px-3 py-1.5 font-medium">Venda unit</th>
                            <th className="text-right px-3 py-1.5 font-medium">Custo unit</th>
                            <th className="text-right px-3 py-1.5 font-medium">Total venda</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {(pp.componentes ?? []).map((c: any) => (
                            <tr key={c.id}>
                              <td className="px-3 py-2 text-slate-700">
                                {c.componente?.nome}
                                <span className="ml-1.5 text-xs text-slate-400">{c.componente?.categoria}</span>
                              </td>
                              <td className="px-3 py-2 text-center text-slate-500">{c.quantidade}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(c.valor_venda_unit)}</td>
                              <td className="px-3 py-2 text-right text-slate-400">{formatCurrency(c.custo_interno_unit)}</td>
                              <td className="px-3 py-2 text-right font-medium">{formatCurrency(c.quantidade * c.valor_venda_unit)}</td>
                            </tr>
                          ))}
                          {(pp.servicos ?? []).map((s: any) => (
                            <tr key={s.id} className="bg-blue-50/30">
                              <td className="px-3 py-2 text-slate-700">
                                {s.servico?.nome}
                                <span className="ml-1.5 text-xs text-blue-400">serviço</span>
                              </td>
                              <td className="px-3 py-2 text-center text-slate-500">{s.quantidade}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(s.valor_venda_unit)}</td>
                              <td className="px-3 py-2 text-right text-slate-400">{formatCurrency(s.custo_interno_unit)}</td>
                              <td className="px-3 py-2 text-right font-medium">{formatCurrency(s.quantidade * s.valor_venda_unit)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar de ação */}
        <div className="space-y-4">
          {/* Info da proposta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Dados da proposta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoRow label="Orçamento alvo" value={formatCurrency(proposta.orcamento_alvo)} />
              <InfoRow label="Limite máx." value={formatCurrency(proposta.limite_orcamento_max)} />
              {proposta.publico_descricao && (
                <InfoRow label="Público" value={proposta.publico_descricao} />
              )}
              {proposta.repasse_tipo && proposta.repasse_tipo !== 'Nenhum' && (
                <InfoRow
                  label="Repasse"
                  value={`${proposta.repasse_tipo} — ${formatCurrency(proposta.repasse_valor)}`}
                />
              )}
              {proposta.cliente_cidade && (
                <InfoRow label="Cidade" value={proposta.cliente_cidade} />
              )}
              <InfoRow
                label="Criado em"
                value={proposta.criado_em.slice(0, 10).split('-').reverse().join('/')}
              />
              <InfoRow label="Criado por" value={proposta.criador?.nome ?? '—'} />
            </CardContent>
          </Card>

          {/* Botões de decisão */}
          <Card className="border-slate-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Decisão</CardTitle>
            </CardHeader>
            <CardContent>
              <AprovacaoBtns propostaId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between py-1">
      <span className={`text-sm ${muted ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-slate-900' : muted ? 'text-slate-400' : 'text-slate-700'}`}>
        {value}
      </span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  )
}
