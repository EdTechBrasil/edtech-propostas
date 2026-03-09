import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent } from '@/utils/format'
import Link from 'next/link'
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react'

export default async function Aprovacoes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Só Gestor e ADM podem ver esta página
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single<{ perfil: string }>()

  if (!usuario || (usuario.perfil !== 'Gestor' && usuario.perfil !== 'ADM')) {
    notFound()
  }

  const { data: aprovacoes } = await supabase
    .from('aprovacao_excecao_margem')
    .select(`
      id,
      margem_minima_percent,
      margem_calculada_percent,
      criado_em,
      proposta:propostas(
        id,
        orcamento_alvo,
        status,
        cliente_nome_instituicao,
        criado_em
      ),
      solicitante:usuarios!solicitado_por_usuario_id(nome)
    `)
    .is('aprovado_em', null)
    .order('criado_em', { ascending: true })

  const pendentes = (aprovacoes ?? []).filter((a: any) => a.proposta?.status === 'Aguardando_aprovacao')

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Aprovações de Margem</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Propostas que solicitaram exceção abaixo da margem mínima
        </p>
      </div>

      {pendentes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
          <ShieldCheck className="w-10 h-10 mb-3" />
          <p className="font-medium">Nenhuma aprovação pendente</p>
          <p className="text-sm mt-1">Todas as solicitações foram processadas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendentes.map((a: any) => {
            const proposta = a.proposta
            const diferenca = a.margem_calculada_percent - a.margem_minima_percent
            const diasAguardando = Math.floor(
              (Date.now() - new Date(a.criado_em).getTime()) / (1000 * 60 * 60 * 24)
            )

            return (
              <Card key={a.id} className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-950/20">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Cabeçalho */}
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <span className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                          Aguardando há {diasAguardando === 0 ? 'hoje' : `${diasAguardando} dia${diasAguardando > 1 ? 's' : ''}`}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">·</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{proposta?.id?.slice(0, 8)}…</span>
                      </div>

                      {/* Info da proposta */}
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {proposta?.cliente_nome_instituicao || <span className="text-slate-400 dark:text-slate-500 font-normal italic">Sem dados do cliente</span>}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Solicitado por <strong className="text-slate-700 dark:text-slate-300">{a.solicitante?.nome ?? '—'}</strong>
                        {' · '}Orçamento: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(proposta?.orcamento_alvo ?? 0)}</strong>
                      </p>

                      {/* Indicador de margem */}
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-sm font-bold text-red-700 dark:text-red-400">
                            {formatPercent(a.margem_calculada_percent)} calculada
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">vs</div>
                        <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                          <span className="font-medium">{formatPercent(a.margem_minima_percent)}</span>
                          <span>mínimo</span>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
                          {formatPercent(Math.abs(diferenca))} abaixo
                        </Badge>
                      </div>
                    </div>

                    {/* Botão de ação */}
                    <Link href={`/aprovacao/${proposta?.id}`}>
                      <Button className="shrink-0">
                        Analisar →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
