'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/format'
import { duplicarProposta, cancelarProposta, reordenarPropostas } from '@/lib/actions/proposta'
import { linkProposta } from '@/lib/constants'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  FilePlus, FileText, Clock, CheckCircle2, XCircle, PenLine, Eye,
  History, Copy, Loader2, Search,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DragHandle } from '@/components/ui/drag-handle'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
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

const STATUS_CONFIG: Record<string, {
  label: string
  icon: React.ElementType
  className: string
}> = {
  Rascunho:              { label: 'Rascunho',          icon: FileText,     className: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
  Em_revisao:            { label: 'Em revisão',         icon: PenLine,      className: 'bg-blue-50 text-blue-600' },
  Aguardando_aprovacao:  { label: 'Pendente',           icon: Clock,        className: 'bg-amber-50 text-amber-600' },
  Aprovada_excecao:      { label: 'Aprovada',           icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600' },
  Pronta_pdf:            { label: 'Pronta',             icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600' },
  Cancelada:             { label: 'Cancelada',          icon: XCircle,      className: 'bg-red-50 text-red-500' },
}

const FILTROS = [
  { value: 'todos',                label: 'Todas' },
  { value: 'Rascunho',             label: 'Rascunho' },
  { value: 'Em_revisao',           label: 'Em revisão' },
  { value: 'Aguardando_aprovacao', label: 'Pendente' },
  { value: 'Aprovada_excecao',     label: 'Aprovada' },
  { value: 'Pronta_pdf',           label: 'Pronta' },
  { value: 'Cancelada',            label: 'Cancelada' },
]

function numeroProposta(id: string, criado_em: string) {
  const ano = criado_em.slice(0, 4)
  return `PROP-${ano}-${id.slice(0, 4).toUpperCase()}`
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, icon: FileText, className: 'bg-slate-100 text-slate-600' }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cfg.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  )
}

// ── Linha sortable ────────────────────────────────────────────────────────────

function SortableRow({
  proposta: p,
  podeVerGestor,
}: {
  proposta: Proposta
  podeVerGestor: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 'auto',
  }

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group border-b border-slate-100 dark:border-slate-700 last:border-0">
      <td className="px-2 py-4 w-8">
        <DragHandle
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100"
        />
      </td>
      <td className="px-4 py-4">
        <Link
          href={linkProposta(p.id, p.status)}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 font-mono"
        >
          {numeroProposta(p.id, p.criado_em)}
        </Link>
      </td>
      <td className="px-4 py-4">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {p.cliente_nome_instituicao || <span className="text-slate-400 dark:text-slate-500 italic">Sem dados do cliente</span>}
        </p>
        {podeVerGestor && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{p.criador_nome}</p>
        )}
      </td>
      <td className="px-4 py-4">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {p.criado_em.slice(0, 10).split('-').reverse().join('/')}
        </span>
      </td>
      <td className="px-4 py-4">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrency(p.orcamento_alvo)}
        </span>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={p.status} />
      </td>
      <td className="px-4 py-4 text-right">
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

export function PropostasCliente({
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

  const podeVerGestor = usuario.perfil === 'Gestor' || usuario.perfil === 'ADM'

  const filtradas = useMemo(
    () => items.filter(p => {
      const matchFiltro = filtro === 'todos' || p.status === filtro
      const matchBusca = !busca || (p.cliente_nome_instituicao ?? '').toLowerCase().includes(busca.toLowerCase())
      return matchFiltro && matchBusca
    }),
    [items, filtro, busca]
  )

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

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex-1">Minhas Propostas</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
          <label htmlFor="busca-propostas" className="sr-only">Buscar propostas</label>
          <input
            id="busca-propostas"
            type="text"
            placeholder="Buscar propostas..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-full border-0 outline-none focus:ring-2 focus:ring-indigo-300 w-40 sm:w-52 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
        <Link href="/proposta/nova">
          <Button className="gap-2">
            <FilePlus className="w-4 h-4" />
            Nova Proposta
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {FILTROS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltro(f.value)}
            aria-current={filtro === f.value ? 'page' : undefined}
            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              filtro === f.value
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden overflow-x-auto">
        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500">
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
            <thead className="border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th scope="col" className="w-8 px-2 py-3" />
                <th scope="col" className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">
                  Número
                </th>
                <th scope="col" className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">
                  Cliente
                </th>
                <th scope="col" className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">
                  Data
                </th>
                <th scope="col" className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">
                  Valor Total
                </th>
                <th scope="col" className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th scope="col" className="text-right text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">
                  Ações
                </th>
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
                <tbody className="bg-white dark:bg-slate-800">
                  {filtradas.map(p => (
                    <SortableRow
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
  )
}

// ── Botões de ação ────────────────────────────────────────────────────────────

function CancelarBtn({ propostaId }: { propostaId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState('')
  const router = useRouter()

  function handleCancelar() {
    setErro('')
    startTransition(async () => {
      const result = await cancelarProposta(propostaId)
      if ('error' in result) {
        setErro(result.error ?? 'Erro ao cancelar')
        return
      }
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
          {erro && (
            <p className="text-sm text-destructive px-1">{erro}</p>
          )}
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
