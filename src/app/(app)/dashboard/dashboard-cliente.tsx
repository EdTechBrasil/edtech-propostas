'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/format'
import { duplicarProposta, cancelarProposta, reordenarPropostas } from '@/lib/actions/proposta'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  FilePlus, FileText, Clock, CheckCircle2, XCircle, PenLine, Eye, History, Copy,
  Loader2, BarChart3, Search,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DragHandle } from '@/components/ui/drag-handle'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Proposta = {
  id: string
  orcamento_alvo: number
  status: string
  criado_em: string
  cliente_nome_instituicao: string | null
  criador_nome: string
  perfil_atual: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  Rascunho:              { label: 'Rascunho',             className: 'bg-slate-100 text-slate-600' },
  Em_revisao:            { label: 'Em revisão',           className: 'bg-blue-100 text-blue-700' },
  Aguardando_aprovacao:  { label: 'Aguard. aprovação',    className: 'bg-yellow-100 text-yellow-700' },
  Aprovada_excecao:      { label: 'Aprovada (exceção)',   className: 'bg-purple-100 text-purple-700' },
  Pronta_pdf:            { label: 'Pronta',               className: 'bg-green-100 text-green-700' },
  Cancelada:             { label: 'Cancelada',            className: 'bg-red-100 text-red-600' },
}

const FILTROS = [
  { value: 'todos',                label: 'Todas' },
  { value: 'Rascunho',             label: 'Rascunho' },
  { value: 'Em_revisao',           label: 'Em revisão' },
  { value: 'Aguardando_aprovacao', label: 'Aguard. aprovação' },
  { value: 'Aprovada_excecao',     label: 'Aprovada' },
  { value: 'Pronta_pdf',           label: 'Pronta' },
  { value: 'Cancelada',            label: 'Cancelada' },
]

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

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
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

function AtividadeRecente({
  propostas,
  onVerTodas,
}: {
  propostas: Proposta[]
  onVerTodas: () => void
}) {
  const recentes = [...propostas]
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
    .slice(0, 5)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-900">Atividade Recente</h2>
        <button
          onClick={onVerTodas}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          Ver todas
        </button>
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

// ── Linha sortable da tabela ──────────────────────────────────────────────────

function SortablePropostaRow({
  proposta: p,
  podeVerGestor,
}: {
  proposta: Proposta
  podeVerGestor: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 'auto',
  }

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-slate-50 transition-colors group">
      <td className="px-2 py-3 w-8">
        <DragHandle
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100"
        />
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-slate-900">
          {p.cliente_nome_instituicao || <span className="text-slate-400 italic">Sem dados do cliente</span>}
        </p>
        <p className="text-xs text-slate-400 font-mono mt-0.5">{p.id.slice(0, 8)}…</p>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-medium text-slate-700">
          {formatCurrency(p.orcamento_alvo)}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <StatusBadge status={p.status} />
      </td>
      {podeVerGestor && (
        <td className="px-4 py-3">
          <span className="text-sm text-slate-600">{p.criador_nome}</span>
        </td>
      )}
      <td className="px-4 py-3">
        <span className="text-sm text-slate-500">
          {p.criado_em.slice(0, 10).split('-').reverse().join('/')}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center justify-end gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/historico/${p.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700">
                    <History className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Histórico</TooltipContent>
            </Tooltip>

            <DuplicarBtn propostaId={p.id} />

            {p.status !== 'Pronta_pdf' && p.status !== 'Cancelada' && (
              <CancelarBtn propostaId={p.id} />
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={linkProposta(p.id, p.status)}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700">
                    {p.status === 'Pronta_pdf' ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <PenLine className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                {p.status === 'Pronta_pdf' ? 'Ver proposta' : 'Editar'}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </td>
    </tr>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function DashboardCliente({
  propostas,
  usuario,
}: {
  propostas: Proposta[]
  usuario: { nome: string; perfil: string }
}) {
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [items, setItems] = useState(propostas)
  const [, startTransition] = useTransition()
  const tabelaRef = useRef<HTMLDivElement>(null)

  const podeVerGestor = usuario.perfil === 'Gestor' || usuario.perfil === 'ADM'

  // Stats para summary cards
  const volumeTotal = items
    .filter(p => p.status !== 'Cancelada')
    .reduce((s, p) => s + p.orcamento_alvo, 0)
  const aprovadas = items.filter(p => p.status === 'Pronta_pdf' || p.status === 'Aprovada_excecao').length
  const aguardando = items.filter(p => p.status === 'Aguardando_aprovacao').length

  // Badge de variação mensal no volume
  const hoje = new Date()
  const mesAtualKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
  const mesAnteriorKey = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`
  const volAtual = items
    .filter(p => p.status !== 'Cancelada' && p.criado_em.startsWith(mesAtualKey))
    .reduce((s, p) => s + p.orcamento_alvo, 0)
  const volAnterior = items
    .filter(p => p.status !== 'Cancelada' && p.criado_em.startsWith(mesAnteriorKey))
    .reduce((s, p) => s + p.orcamento_alvo, 0)
  const volumeBadge = volAnterior > 0 ? {
    text: `${volAtual >= volAnterior ? '+' : ''}${Math.round(((volAtual - volAnterior) / volAnterior) * 100)}%`,
    positive: volAtual >= volAnterior,
  } : null

  // Itens filtrados para a tabela
  const filtradas = items
    .filter(p => filtro === 'todos' || p.status === filtro)
    .filter(p => !busca || (p.cliente_nome_instituicao ?? '').toLowerCase().includes(busca.toLowerCase()))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(p => p.id === active.id)
    const newIndex = items.findIndex(p => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const novaOrdem = arrayMove(items, oldIndex, newIndex)
    setItems(novaOrdem)
    const updates = novaOrdem.map((p, i) => ({ id: p.id, ordem: i + 1 }))
    startTransition(() => { reordenarPropostas(updates) })
  }

  function scrollToTabela() {
    tabelaRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header da página */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex-1">Visão Geral</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar propostas..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-slate-100 rounded-full border-0 outline-none focus:ring-2 focus:ring-indigo-300 w-52 placeholder:text-slate-400"
          />
        </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-8">
        <BarChartMensal propostas={items} />
        <AtividadeRecente propostas={items} onVerTodas={scrollToTabela} />
      </div>

      {/* Tabela completa */}
      <div ref={tabelaRef}>
        {/* Filtro por tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {FILTROS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltro(f.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                filtro === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {f.label}
              {f.value !== 'todos' && (
                <span className={`ml-1.5 text-xs ${filtro === f.value ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {items.filter(p => p.status === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden overflow-x-auto">
          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <FileText className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium">Nenhuma proposta encontrada</p>
              {filtro === 'todos' && !busca && (
                <Link href="/proposta/nova">
                  <Button variant="link" size="sm" className="mt-2">Criar primeira proposta →</Button>
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="w-8 px-2 py-3" />
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                    Cliente / Instituição
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                    Orçamento alvo
                  </th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                    Status
                  </th>
                  {podeVerGestor && (
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Criado por
                    </th>
                  )}
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                    Data
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filtradas.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filtradas.map((p) => (
                      <SortablePropostaRow
                        key={p.id}
                        proposta={p}
                        podeVerGestor={podeVerGestor}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </DndContext>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function CancelarBtn({ propostaId }: { propostaId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleCancelar() {
    startTransition(async () => {
      await cancelarProposta(propostaId)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
              onClick={() => setOpen(true)}
            >
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cancelar</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar proposta</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A proposta ficará com status <strong>Cancelada</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Voltar</Button>
            <Button
              variant="destructive"
              onClick={handleCancelar}
              disabled={isPending}
              className="gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DuplicarBtn({ propostaId }: { propostaId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDuplicar() {
    startTransition(async () => {
      const result = await duplicarProposta(propostaId)
      if ('novaPropostaId' in result) {
        router.push(`/proposta/${result.novaPropostaId}/publico`)
      }
    })
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
            onClick={handleDuplicar}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Duplicar</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
