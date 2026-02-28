'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  criarProduto,
  atualizarProduto,
  excluirProduto,
  toggleAtivoProduto,
  criarComponenteProduto,
  atualizarComponenteProduto,
  excluirComponenteProduto,
  criarServicoProduto,
  atualizarServicoProduto,
  excluirServicoProduto,
  reordenarProdutos,
  atualizarValorComponente,
  atualizarValorServico,
} from '@/lib/actions/admin'
import { PackagePlus, ChevronDown, ChevronRight, Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
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

type Componente = {
  id: string
  nome: string
  categoria: string
  tipo_calculo: string
  valor_venda_base: number
  custo_interno_base: number
  obrigatorio: boolean
}

type Servico = {
  id: string
  nome: string
  tipo_calculo: string
  valor_venda_base: number
  custo_interno_base: number
  obrigatorio: boolean
}

type Produto = {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  componentes: Componente[]
  servicos: Servico[]
}

const CATEGORIAS = ['LicencaAluno', 'LicencaProfessor', 'Kit', 'Livro', 'Tema', 'Pagina', 'Credito', 'ItemFixo', 'Plataforma']
const TIPOS_CALCULO = ['Fixo', 'PorAluno', 'PorProfessor', 'PorEscola', 'PorSerie']

// ── Célula de valor editável inline ──────────────────────────────────────────

function ValorEditavel({
  valor,
  onSave,
}: {
  valor: number
  onSave: (novoValor: number) => void
}) {
  const [editando, setEditando] = useState(false)
  const [valorLocal, setValorLocal] = useState(valor)
  const [raw, setRaw] = useState(String(valor))

  function handleBlur() {
    const parsed = parseFloat(raw.replace(',', '.'))
    if (!isNaN(parsed)) {
      if (parsed !== valorLocal) {
        setValorLocal(parsed)
        onSave(parsed)
      }
    } else {
      setRaw(String(valorLocal))
    }
    setEditando(false)
  }

  if (editando) {
    return (
      <input
        autoFocus
        type="number"
        min="0"
        step="0.01"
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        className="w-24 text-right border border-primary rounded px-1.5 py-0.5 text-sm outline-none"
      />
    )
  }

  return (
    <button
      type="button"
      title="Clique para editar"
      onClick={() => { setRaw(String(valorLocal)); setEditando(true) }}
      className={`text-right w-full hover:bg-primary/10 rounded px-1.5 py-0.5 transition-colors ${
        valorLocal === 0 ? 'text-red-400 font-medium' : 'text-slate-700'
      }`}
    >
      {valorLocal === 0 ? '— editar' : `R$ ${valorLocal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
    </button>
  )
}

// ── Dialog reutilizável para componente (criar ou editar) ─────────────────────

function ComponenteDialog({
  produtoId,
  componente,
  trigger,
}: {
  produtoId: string
  componente?: Componente
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState('')
  const isEdit = !!componente

  function handleSubmit(formData: FormData) {
    formData.set('produto_id', produtoId)
    setErro('')
    startTransition(async () => {
      const result = isEdit
        ? await atualizarComponenteProduto(componente!.id, formData)
        : await criarComponenteProduto(formData)
      if ('error' in result) {
        setErro(result.error ?? 'Erro inesperado')
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar componente' : 'Adicionar componente'}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input name="nome" defaultValue={componente?.nome} placeholder="Ex: Licença Aluno Digital" required />
          </div>
          <div className="space-y-2">
            <Label>Categoria *</Label>
            <select name="categoria" defaultValue={componente?.categoria ?? CATEGORIAS[0]}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de cálculo *</Label>
            <select name="tipo_calculo" defaultValue={componente?.tipo_calculo ?? TIPOS_CALCULO[0]}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
              {TIPOS_CALCULO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor de venda base (R$)</Label>
              <Input name="valor_venda_base" type="number" min="0" step="0.01" defaultValue={componente?.valor_venda_base ?? 0} />
            </div>
            <div className="space-y-2">
              <Label>Custo interno base (R$)</Label>
              <Input name="custo_interno_base" type="number" min="0" step="0.01" defaultValue={componente?.custo_interno_base ?? 0} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input id={`obrig-comp-${componente?.id ?? 'new'}`} type="checkbox" name="obrigatorio"
              value="true" defaultChecked={componente?.obrigatorio} className="h-4 w-4 rounded border-gray-300" />
            <Label htmlFor={`obrig-comp-${componente?.id ?? 'new'}`} className="font-normal cursor-pointer">
              Obrigatório (não pode ser removido da proposta)
            </Label>
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Dialog reutilizável para serviço (criar ou editar) ────────────────────────

function ServicoDialog({
  produtoId,
  servico,
  trigger,
}: {
  produtoId: string
  servico?: Servico
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState('')
  const isEdit = !!servico

  function handleSubmit(formData: FormData) {
    formData.set('produto_id', produtoId)
    setErro('')
    startTransition(async () => {
      const result = isEdit
        ? await atualizarServicoProduto(servico!.id, formData)
        : await criarServicoProduto(formData)
      if ('error' in result) {
        setErro(result.error ?? 'Erro inesperado')
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar serviço' : 'Adicionar serviço'}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input name="nome" defaultValue={servico?.nome} placeholder="Ex: Implantação" required />
          </div>
          <div className="space-y-2">
            <Label>Tipo de cálculo *</Label>
            <select name="tipo_calculo" defaultValue={servico?.tipo_calculo ?? TIPOS_CALCULO[0]}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
              {TIPOS_CALCULO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor de venda base (R$)</Label>
              <Input name="valor_venda_base" type="number" min="0" step="0.01" defaultValue={servico?.valor_venda_base ?? 0} />
            </div>
            <div className="space-y-2">
              <Label>Custo interno base (R$)</Label>
              <Input name="custo_interno_base" type="number" min="0" step="0.01" defaultValue={servico?.custo_interno_base ?? 0} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input id={`obrig-serv-${servico?.id ?? 'new'}`} type="checkbox" name="obrigatorio"
              value="true" defaultChecked={servico?.obrigatorio} className="h-4 w-4 rounded border-gray-300" />
            <Label htmlFor={`obrig-serv-${servico?.id ?? 'new'}`} className="font-normal cursor-pointer">
              Obrigatório (não pode ser removido da proposta)
            </Label>
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Card de produto (sortable) ────────────────────────────────────────────────

function ProdutoCard({ produto }: { produto: Produto }) {
  const [expandido, setExpandido] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openExcluir, setOpenExcluir] = useState(false)
  const [erroExcluir, setErroExcluir] = useState('')
  const [confirmarExcluirComp, setConfirmarExcluirComp] = useState<{ id: string; nome: string } | null>(null)
  const [confirmarExcluirServ, setConfirmarExcluirServ] = useState<{ id: string; nome: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: produto.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 'auto',
  }

  function handleToggle() {
    startTransition(async () => { await toggleAtivoProduto(produto.id, !produto.ativo) })
  }

  function handleExcluirConfirmado() {
    setErroExcluir('')
    startTransition(async () => {
      const result = await excluirProduto(produto.id)
      if ('error' in result) {
        setErroExcluir(result.error ?? 'Erro ao excluir')
      } else {
        setOpenExcluir(false)
      }
    })
  }

  function handleExcluirComponenteConfirmado() {
    if (!confirmarExcluirComp) return
    const id = confirmarExcluirComp.id
    setConfirmarExcluirComp(null)
    startTransition(async () => { await excluirComponenteProduto(id) })
  }

  function handleExcluirServicoConfirmado() {
    if (!confirmarExcluirServ) return
    const id = confirmarExcluirServ.id
    setConfirmarExcluirServ(null)
    startTransition(async () => { await excluirServicoProduto(id) })
  }

  const totalItens = produto.componentes.length + produto.servicos.length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border overflow-hidden transition-opacity ${isPending ? 'opacity-50' : ''} ${produto.ativo ? 'border-slate-200' : 'border-slate-100'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white group">
        <DragHandle
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0"
        />

        <button type="button" onClick={() => setExpandido(!expandido)} className="text-slate-400 hover:text-slate-600">
          {expandido ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <button type="button" onClick={() => setExpandido(!expandido)} className="flex-1 text-left">
          <p className={`font-semibold ${produto.ativo ? 'text-slate-900' : 'text-slate-400'}`}>{produto.nome}</p>
          {produto.descricao && <p className="text-xs text-slate-400 mt-0.5">{produto.descricao}</p>}
        </button>

        <span className="text-xs text-slate-400 font-medium">{totalItens} itens</span>

        {/* Editar produto */}
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogTrigger asChild>
            <button type="button" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar produto</DialogTitle></DialogHeader>
            <form action={(fd) => {
              startTransition(async () => {
                await atualizarProduto(produto.id, fd)
                setOpenEdit(false)
              })
            }} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input name="nome" defaultValue={produto.nome} required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input name="descricao" defaultValue={produto.descricao ?? ''} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Excluir produto */}
        <button type="button" onClick={() => setOpenExcluir(true)}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
        <Dialog open={openExcluir} onOpenChange={(v) => { setOpenExcluir(v); if (!v) setErroExcluir('') }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir produto</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-600">
              Tem certeza que deseja excluir <strong>{produto.nome}</strong>? Esta ação não pode ser desfeita.
            </p>
            {erroExcluir && <p className="text-sm text-red-600">{erroExcluir}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpenExcluir(false); setErroExcluir('') }}>Cancelar</Button>
              <Button variant="destructive" onClick={handleExcluirConfirmado} disabled={isPending}>Excluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-2 ml-1 pl-3 border-l border-slate-100">
          <span className="text-xs text-slate-500">{produto.ativo ? 'Ativo' : 'Inativo'}</span>
          <Switch checked={produto.ativo} onCheckedChange={handleToggle} />
        </div>
      </div>

      {/* Conteúdo expandido */}
      {expandido && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-5">
          {/* Componentes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Componentes</p>
              <ComponenteDialog produtoId={produto.id} trigger={
                <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                  <Plus className="w-3 h-3" /> Componente
                </Button>
              } />
            </div>
            {produto.componentes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum componente</p>
            ) : (
              <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400">
                      <th className="text-left px-3 py-2 font-medium">Nome</th>
                      <th className="text-left px-3 py-2 font-medium">Categoria</th>
                      <th className="text-left px-3 py-2 font-medium">Cálculo</th>
                      <th className="text-right px-3 py-2 font-medium">Venda base</th>
                      <th className="text-right px-3 py-2 font-medium">Custo base</th>
                      <th className="text-center px-3 py-2 font-medium">Obrig.</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {produto.componentes.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-800">{c.nome}</td>
                        <td className="px-3 py-2 text-slate-500">{c.categoria}</td>
                        <td className="px-3 py-2 text-slate-500">{c.tipo_calculo}</td>
                        <td className="px-3 py-2 text-right">
                          <ValorEditavel
                            valor={c.valor_venda_base}
                            onSave={v => startTransition(() => atualizarValorComponente(c.id, v, c.custo_interno_base))}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <ValorEditavel
                            valor={c.custo_interno_base}
                            onSave={v => startTransition(() => atualizarValorComponente(c.id, c.valor_venda_base, v))}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {c.obrigatorio
                            ? <span className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">Sim</span>
                            : <span className="text-xs text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <ComponenteDialog produtoId={produto.id} componente={c} trigger={
                              <button type="button" className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            } />
                            <button type="button" onClick={() => setConfirmarExcluirComp({ id: c.id, nome: c.nome })}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Separator />

          {/* Serviços */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Serviços</p>
              <ServicoDialog produtoId={produto.id} trigger={
                <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                  <Plus className="w-3 h-3" /> Serviço
                </Button>
              } />
            </div>
            {produto.servicos.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum serviço</p>
            ) : (
              <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400">
                      <th className="text-left px-3 py-2 font-medium">Nome</th>
                      <th className="text-left px-3 py-2 font-medium">Cálculo</th>
                      <th className="text-right px-3 py-2 font-medium">Venda base</th>
                      <th className="text-right px-3 py-2 font-medium">Custo base</th>
                      <th className="text-center px-3 py-2 font-medium">Obrig.</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {produto.servicos.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-800">{s.nome}</td>
                        <td className="px-3 py-2 text-slate-500">{s.tipo_calculo}</td>
                        <td className="px-3 py-2 text-right">
                          <ValorEditavel
                            valor={s.valor_venda_base}
                            onSave={v => startTransition(() => atualizarValorServico(s.id, v, s.custo_interno_base))}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <ValorEditavel
                            valor={s.custo_interno_base}
                            onSave={v => startTransition(() => atualizarValorServico(s.id, s.valor_venda_base, v))}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {s.obrigatorio
                            ? <span className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">Sim</span>
                            : <span className="text-xs text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <ServicoDialog produtoId={produto.id} servico={s} trigger={
                              <button type="button" className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            } />
                            <button type="button" onClick={() => setConfirmarExcluirServ({ id: s.id, nome: s.nome })}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog confirmar excluir componente */}
      <Dialog open={!!confirmarExcluirComp} onOpenChange={(v) => !v && setConfirmarExcluirComp(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir componente</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">
            Tem certeza que deseja excluir <strong>{confirmarExcluirComp?.nome}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarExcluirComp(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleExcluirComponenteConfirmado} disabled={isPending}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar excluir serviço */}
      <Dialog open={!!confirmarExcluirServ} onOpenChange={(v) => !v && setConfirmarExcluirServ(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir serviço</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">
            Tem certeza que deseja excluir <strong>{confirmarExcluirServ?.nome}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarExcluirServ(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleExcluirServicoConfirmado} disabled={isPending}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ProdutosAdminCliente({ produtos: produtosIniciais }: { produtos: Produto[] }) {
  const [openNovo, setOpenNovo] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState('')
  const [produtos, setProdutos] = useState(produtosIniciais)

  function handleCriar(formData: FormData) {
    setErro('')
    startTransition(async () => {
      const result = await criarProduto(formData)
      if ('error' in result) {
        setErro(result.error ?? 'Erro inesperado')
      } else {
        setOpenNovo(false)
      }
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = produtos.findIndex(p => p.id === active.id)
    const newIndex = produtos.findIndex(p => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const novaOrdem = arrayMove(produtos, oldIndex, newIndex)
    setProdutos(novaOrdem)

    const updates = novaOrdem.map((p, i) => ({ id: p.id, ordem: i + 1 }))
    startTransition(() => { reordenarProdutos(updates) })
  }

  const ativos = produtos.filter(p => p.ativo).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo de Produtos</h1>
          <p className="text-slate-500 mt-1">{produtos.length} produto(s) — {ativos} ativo(s)</p>
        </div>

        <Dialog open={openNovo} onOpenChange={setOpenNovo}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PackagePlus className="w-4 h-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar novo produto</DialogTitle></DialogHeader>
            <form action={handleCriar} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do produto *</Label>
                <Input name="nome" placeholder="Ex: Plataforma Digital Completa" required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input name="descricao" placeholder="Breve descrição (opcional)" />
              </div>
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar produto
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {produtos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
          <PackagePlus className="w-10 h-10 mb-3" />
          <p className="font-medium">Nenhum produto cadastrado</p>
          <p className="text-sm mt-1">Crie o primeiro produto para começar</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={produtos.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {produtos.map((p) => (
                <ProdutoCard key={p.id} produto={p} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
