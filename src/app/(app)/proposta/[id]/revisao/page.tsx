import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent, margemBgColor } from '@/utils/format'
import { SolicitarAprovacaoBtn } from './solicitar-aprovacao-btn'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react'

export default async function RevisaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [{ data: proposta }, { data: financeiro }, { data: usuario }, { data: config }] = await Promise.all([
    supabase
      .from('propostas')
      .select('id, status, orcamento_alvo, limite_orcamento_max')
      .eq('id', id)
      .single<{ id: string; status: string; orcamento_alvo: number; limite_orcamento_max: number }>(),
    supabase
      .from('proposta_financeiro')
      .select('*')
      .eq('proposta_id', id)
      .single<{
        proposta_id: string
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
      .from('usuarios')
      .select('perfil')
      .eq('id', user.id)
      .single<{ perfil: string }>(),
    supabase
      .from('configuracao_financeira')
      .select('margem_minima_percent')
      .eq('ativo', true)
      .single<{ margem_minima_percent: number }>(),
  ])

  if (!proposta) notFound()

  const perfil = usuario?.perfil ?? 'Comercial'
  const podeVerFinanceiro = perfil === 'Gestor' || perfil === 'ADM'
  const margem = financeiro?.margem_percent ?? 0
  const margem_minima = config?.margem_minima_percent ?? 12
  const margemOk = margem >= margem_minima
  const aguardandoAprovacao = proposta.status === 'Aguardando_aprovacao'
  const aprovadaExcecao = proposta.status === 'Aprovada_excecao'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Revisão Financeira</h1>
        <p className="text-slate-500 mt-1">Análise final antes de gerar o PDF</p>
      </div>

      <div className={`flex items-center gap-3 rounded-lg p-4 mb-6 ${
        aguardandoAprovacao ? 'bg-yellow-50 border border-yellow-200' :
        aprovadaExcecao ? 'bg-green-50 border border-green-200' :
        margemOk ? 'bg-green-50 border border-green-200' :
        'bg-red-50 border border-red-200'
      }`}>
        {aguardandoAprovacao ? (
          <><Clock className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="font-medium text-yellow-800">Aguardando aprovação</p>
            <p className="text-sm text-yellow-600">Um Gestor ou ADM precisa autorizar a margem abaixo do mínimo.</p>
          </div></>
        ) : aprovadaExcecao ? (
          <><CheckCircle2 className="w-5 h-5 text-green-500" />
          <div>
            <p className="font-medium text-green-800">Exceção aprovada</p>
            <p className="text-sm text-green-600">Proposta autorizada com margem abaixo do mínimo.</p>
          </div></>
        ) : margemOk ? (
          <><CheckCircle2 className="w-5 h-5 text-green-500" />
          <div>
            <p className="font-medium text-green-800">Margem dentro do limite</p>
            <p className="text-sm text-green-600">Proposta pode avançar para a próxima etapa.</p>
          </div></>
        ) : (
          <><AlertTriangle className="w-5 h-5 text-red-500" />
          <div>
            <p className="font-medium text-red-800">Margem abaixo do mínimo ({margem_minima}%)</p>
            <p className="text-sm text-red-600">É necessário solicitar aprovação de exceção para continuar.</p>
          </div></>
        )}
      </div>

      {podeVerFinanceiro && financeiro ? (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Resumo financeiro</CardTitle>
              <span className={`text-2xl font-bold ${margemBgColor(margem)} px-3 py-1 rounded-lg`}>
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
      ) : !podeVerFinanceiro ? (
        <Card className="mb-6 border-dashed">
          <CardContent className="flex items-center justify-center h-32 text-slate-400 text-sm">
            Análise financeira disponível apenas para Gestores e ADM
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-between">
        <Link href={`/proposta/${id}/repasse`}>
          <Button variant="outline">← Voltar</Button>
        </Link>
        <div className="flex gap-3">
          {!margemOk && !aguardandoAprovacao && !aprovadaExcecao && (
            <SolicitarAprovacaoBtn
              propostaId={id}
              margemCalculada={margem}
            />
          )}
          {(margemOk || aprovadaExcecao) && (
            <Link href={`/proposta/${id}/cliente`}>
              <Button>Continuar para dados do cliente →</Button>
            </Link>
          )}
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
