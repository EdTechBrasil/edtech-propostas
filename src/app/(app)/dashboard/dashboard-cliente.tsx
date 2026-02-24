'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/format'
import { duplicarProposta, cancelarProposta } from '@/lib/actions/proposta'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { FilePlus, FileText, Clock, CheckCircle2, XCircle, PenLine, Eye, History, Copy, Loader2 } from 'lucide-react'

type Proposta = {
  id: string
  orcamento_alvo: number
  status: string
  criado_em: string
  cliente_nome_instituicao: string | null
  criador_nome: string
  perfil_atual: string
}

type StatsCount = {
  Rascunho: number
  Em_revisao: number
  Aguardando_aprovacao: number
  Aprovada_excecao: number
  Pronta_pdf: number
  Cancelada: number
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
  { value: 'todos',              label: 'Todas' },
  { value: 'Rascunho',          label: 'Rascunho' },
  { value: 'Em_revisao',        label: 'Em revisão' },
  { value: 'Aguardando_aprovacao', label: 'Aguard. aprovação' },
  { value: 'Aprovada_excecao',  label: 'Aprovada' },
  { value: 'Pronta_pdf',        label: 'Pronta' },
  { value: 'Cancelada',         label: 'Cancelada' },
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

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

export function DashboardCliente({
  propostas,
  usuario,
}: {
  propostas: Proposta[]
  usuario: { nome: string; perfil: string }
}) {
  const [filtro, setFiltro] = useState('todos')

  const filtradas = filtro === 'todos' ? propostas : propostas.filter(p => p.status === filtro)

  // Contagens para os cards
  const stats: StatsCount = {
    Rascunho: propostas.filter(p => p.status === 'Rascunho').length,
    Em_revisao: propostas.filter(p => p.status === 'Em_revisao').length,
    Aguardando_aprovacao: propostas.filter(p => p.status === 'Aguardando_aprovacao').length,
    Aprovada_excecao: propostas.filter(p => p.status === 'Aprovada_excecao').length,
    Pronta_pdf: propostas.filter(p => p.status === 'Pronta_pdf').length,
    Cancelada: propostas.filter(p => p.status === 'Cancelada').length,
  }

  const podeVerGestor = usuario.perfil === 'Gestor' || usuario.perfil === 'ADM'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Propostas</h1>
          <p className="text-slate-500 mt-1">
            {usuario.nome} · {usuario.perfil} · {propostas.length} proposta{propostas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/proposta/nova">
          <Button className="gap-2">
            <FilePlus className="w-4 h-4" />
            Nova Proposta
          </Button>
        </Link>
      </div>

      {/* Cards de status */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard
          label="Rascunho"
          count={stats.Rascunho}
          icon={<PenLine className="w-4 h-4 text-slate-400" />}
          active={filtro === 'Rascunho'}
          onClick={() => setFiltro(filtro === 'Rascunho' ? 'todos' : 'Rascunho')}
        />
        <StatCard
          label="Em revisão"
          count={stats.Em_revisao}
          icon={<FileText className="w-4 h-4 text-blue-400" />}
          active={filtro === 'Em_revisao'}
          onClick={() => setFiltro(filtro === 'Em_revisao' ? 'todos' : 'Em_revisao')}
        />
        <StatCard
          label="Aguardando"
          count={stats.Aguardando_aprovacao}
          icon={<Clock className="w-4 h-4 text-yellow-400" />}
          active={filtro === 'Aguardando_aprovacao'}
          onClick={() => setFiltro(filtro === 'Aguardando_aprovacao' ? 'todos' : 'Aguardando_aprovacao')}
          urgente={stats.Aguardando_aprovacao > 0 && podeVerGestor}
        />
        <StatCard
          label="Aprovada"
          count={stats.Aprovada_excecao}
          icon={<CheckCircle2 className="w-4 h-4 text-purple-400" />}
          active={filtro === 'Aprovada_excecao'}
          onClick={() => setFiltro(filtro === 'Aprovada_excecao' ? 'todos' : 'Aprovada_excecao')}
        />
        <StatCard
          label="Pronta"
          count={stats.Pronta_pdf}
          icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
          active={filtro === 'Pronta_pdf'}
          onClick={() => setFiltro(filtro === 'Pronta_pdf' ? 'todos' : 'Pronta_pdf')}
        />
        <StatCard
          label="Cancelada"
          count={stats.Cancelada}
          icon={<XCircle className="w-4 h-4 text-red-400" />}
          active={filtro === 'Cancelada'}
          onClick={() => setFiltro(filtro === 'Cancelada' ? 'todos' : 'Cancelada')}
        />
      </div>

      {/* Filtro por tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {FILTROS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltro(f.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              filtro === f.value
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {f.label}
            {f.value !== 'todos' && (
              <span className={`ml-1.5 text-xs ${filtro === f.value ? 'text-slate-300' : 'text-slate-400'}`}>
                {propostas.filter(p => p.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <FileText className="w-8 h-8 mb-2" />
            <p className="text-sm font-medium">Nenhuma proposta encontrada</p>
            {filtro === 'todos' && (
              <Link href="/proposta/nova">
                <Button variant="link" size="sm" className="mt-2">Criar primeira proposta →</Button>
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
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
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtradas.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
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
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/historico/${p.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700" title="Ver histórico">
                          <History className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <DuplicarBtn propostaId={p.id} />
                      {p.status !== 'Pronta_pdf' && p.status !== 'Cancelada' && (
                        <CancelarBtn propostaId={p.id} />
                      )}
                      <Link href={linkProposta(p.id, p.status)}>
                        <Button variant="ghost" size="sm" className="gap-1.5 h-8">
                          {p.status === 'Pronta_pdf' ? (
                            <><Eye className="w-3.5 h-3.5" /> Ver</>
                          ) : (
                            <><PenLine className="w-3.5 h-3.5" /> Editar</>
                          )}
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  count,
  icon,
  active,
  onClick,
  urgente,
}: {
  label: string
  count: number
  icon: React.ReactNode
  active: boolean
  onClick: () => void
  urgente?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all ${
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : urgente
          ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-400'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        {icon}
        {urgente && !active && (
          <span className="flex h-2 w-2 rounded-full bg-yellow-500" />
        )}
      </div>
      <p className={`text-2xl font-bold ${active ? 'text-white' : 'text-slate-900'}`}>{count}</p>
      <p className={`text-xs mt-0.5 ${active ? 'text-slate-300' : 'text-slate-500'}`}>{label}</p>
    </button>
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
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
        title="Cancelar proposta"
        onClick={() => setOpen(true)}
      >
        <XCircle className="w-3.5 h-3.5" />
      </Button>

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
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
      title="Duplicar proposta"
      onClick={handleDuplicar}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  )
}
