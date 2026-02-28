import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { formatCurrency } from '@/utils/format'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { CancelarPropostaBtn, DuplicarPropostaBtn } from './cancelar-proposta-btn'
import { Comentarios } from './comentarios'

const EVENTO_CONFIG: Record<string, { label: string; dot: string }> = {
  Criacao:            { label: 'Proposta criada',              dot: 'bg-green-500' },
  MudancaOrcamento:   { label: 'Público atualizado',           dot: 'bg-blue-400' },
  AddProduto:         { label: 'Produto adicionado',           dot: 'bg-blue-500' },
  RemoverProduto:     { label: 'Produto removido',             dot: 'bg-red-400' },
  AlterarComponente:  { label: 'Componente alterado',          dot: 'bg-slate-400' },
  AlterarServico:     { label: 'Serviço alterado',             dot: 'bg-slate-400' },
  AlterarDesconto:    { label: 'Desconto alterado',            dot: 'bg-orange-400' },
  AlterarRepasse:     { label: 'Repasse alterado',             dot: 'bg-purple-400' },
  SolicitarAprovacao: { label: 'Aprovação solicitada',         dot: 'bg-yellow-500' },
  AprovarExcecao:     { label: 'Exceção aprovada',             dot: 'bg-green-500' },
  RejeitarExcecao:    { label: 'Exceção rejeitada',            dot: 'bg-red-500' },
  AtualizarCliente:   { label: 'Dados do cliente atualizados', dot: 'bg-blue-400' },
  GerarPDF:           { label: 'PDF gerado',                   dot: 'bg-green-600' },
  Cancelamento:       { label: 'Proposta cancelada',           dot: 'bg-red-600' },
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  Rascunho:             { label: 'Rascunho',           className: 'bg-slate-100 text-slate-600' },
  Em_revisao:           { label: 'Em revisão',         className: 'bg-blue-100 text-blue-700' },
  Aguardando_aprovacao: { label: 'Aguard. aprovação',  className: 'bg-yellow-100 text-yellow-700' },
  Aprovada_excecao:     { label: 'Aprovada (exceção)', className: 'bg-purple-100 text-purple-700' },
  Pronta_pdf:           { label: 'Pronta',             className: 'bg-green-100 text-green-700' },
  Cancelada:            { label: 'Cancelada',          className: 'bg-red-100 text-red-600' },
}

export default async function HistoricoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single<{ perfil: string }>()

  const [{ data: proposta }, { data: historico }, { data: comentarios }] = await Promise.all([
    supabase
      .from('propostas')
      .select(`
        id, status, orcamento_alvo,
        cliente_nome_instituicao, criado_por_usuario_id,
        criador:usuarios!criado_por_usuario_id(nome)
      `)
      .eq('id', id)
      .single<any>(),
    supabase
      .from('proposta_historico')
      .select(`
        id, tipo_evento, detalhes, criado_em,
        autor:usuarios!usuario_id(nome)
      `)
      .eq('proposta_id', id)
      .order('criado_em', { ascending: true }),
    supabase
      .from('proposta_comentarios')
      .select('id, texto, criado_em, autor:usuarios!usuario_id(nome)')
      .eq('proposta_id', id)
      .order('criado_em', { ascending: true }),
  ])

  if (!proposta) notFound()

  const podeVerGestorADM = usuario?.perfil === 'Gestor' || usuario?.perfil === 'ADM'
  const podeCancelar =
    proposta.status !== 'Cancelada' &&
    proposta.status !== 'Pronta_pdf' &&
    (podeVerGestorADM || proposta.criado_por_usuario_id === user.id)

  const statusCfg = STATUS_LABEL[proposta.status] ?? { label: proposta.status, className: 'bg-slate-100 text-slate-600' }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-500">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {proposta.cliente_nome_instituicao || 'Sem dados do cliente'}
              </h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {formatCurrency(proposta.orcamento_alvo)}
              {' · '}Criado por <strong className="text-slate-700">{proposta.criador?.nome ?? '—'}</strong>
              {' · '}<span className="font-mono text-xs">#{id.slice(0, 8)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <DuplicarPropostaBtn propostaId={id} />
          <Link href={`/proposta/${id}/revisao`}>
            <Button variant="outline" size="sm">Abrir proposta</Button>
          </Link>
          {podeCancelar && (
            <CancelarPropostaBtn propostaId={id} />
          )}
        </div>
      </div>

      {/* Timeline */}
      {(historico ?? []).length === 0 ? (
        <div className="flex items-center justify-center h-40 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm">
          Nenhum evento registrado
        </div>
      ) : (
        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />

          <div className="space-y-6">
            {(historico ?? []).map((ev: any, idx: number) => {
              const cfg = EVENTO_CONFIG[ev.tipo_evento] ?? { label: ev.tipo_evento, dot: 'bg-slate-400' }
              const data = ev.criado_em.slice(0, 10).split('-').reverse().join('/')
              const hora = ev.criado_em.slice(11, 16)
              const isLast = idx === (historico ?? []).length - 1

              return (
                <div key={ev.id} className="flex gap-4 pl-1">
                  {/* Dot */}
                  <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1 ring-2 ring-white ${cfg.dot} ${isLast ? 'ring-slate-200' : ''}`} />

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{cfg.label}</p>
                        {ev.detalhes && (
                          <p className="text-xs text-slate-500 mt-0.5">{ev.detalhes}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {ev.autor?.nome ?? '—'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-500">{data}</p>
                        <p className="text-xs text-slate-400">{hora}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Comentarios propostaId={id} comentariosIniciais={(comentarios ?? []) as any} />
    </div>
  )
}
