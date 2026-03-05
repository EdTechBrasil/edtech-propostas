'use client'

import { useState, useTransition } from 'react'
import { adicionarProduto, removerProduto, reordenarProdutos } from '@/lib/actions/proposta'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Loader2, PackageOpen } from 'lucide-react'
import { DragHandle } from '@/components/ui/drag-handle'
import { formatCurrency } from '@/utils/format'
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

interface Produto {
  id: string
  nome: string
  descricao: string | null
  valor_total: number
}

interface PropostaProduto {
  id: string
  produto_id: string
  ordem: number
  produto: { nome: string } | null
}

interface Props {
  propostaId: string
  catalogo: Produto[]
  selecionados: PropostaProduto[]
  idsSelecionados: string[]
  limiteMax: number
  totalAtual: number
}

// ─── Card arrastável (produtos selecionados) ──────────────────────────────────

function SortableProductCard({
  produto,
  isLoading,
  pending,
  onRemover,
}: {
  produto: Produto
  isLoading: boolean
  pending: boolean
  onRemover: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: produto.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style} className="group">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-3 p-4">
          <DragHandle {...attributes} {...listeners} className="opacity-0 group-hover:opacity-100 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-slate-900">{produto.nome}</p>
              <Badge variant="success" className="text-xs">Adicionado</Badge>
            </div>
            {produto.descricao && (
              <p className="text-sm text-slate-500 mt-0.5">{produto.descricao}</p>
            )}
            {produto.valor_total > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(produto.valor_total)}</p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-red-500 border-red-200 hover:bg-red-50 flex-shrink-0"
            onClick={onRemover}
            disabled={isLoading || pending}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span className="ml-1">Remover</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── ProdutosCliente ──────────────────────────────────────────────────────────

export function ProdutosCliente({ propostaId, catalogo, selecionados, idsSelecionados, limiteMax, totalAtual }: Props) {
  const [pending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [lista, setLista] = useState(selecionados)
  const [ordemSelecao, setOrdemSelecao] = useState<string[]>(idsSelecionados)
  const [totalLocal, setTotalLocal] = useState(totalAtual)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleAdicionar(produto: Produto) {
    setLoadingId(produto.id)
    startTransition(async () => {
      const result = await adicionarProduto(propostaId, produto.id)
      if (!result?.error && result?.propostaProdutoId) {
        setOrdemSelecao(prev => [...prev, produto.id])
        setLista(prev => [...prev, {
          id: result.propostaProdutoId,
          produto_id: produto.id,
          ordem: prev.length,
          produto: { nome: produto.nome },
        }])
        setTotalLocal(prev => prev + produto.valor_total)
      }
      setLoadingId(null)
    })
  }

  function handleRemover(proposta_produto_id: string, produto: Produto) {
    setLoadingId(proposta_produto_id)
    startTransition(async () => {
      const result = await removerProduto(proposta_produto_id, propostaId)
      if (!result?.error) {
        setOrdemSelecao(prev => prev.filter(id => id !== produto.id))
        setLista(prev => prev.filter(p => p.id !== proposta_produto_id))
        setTotalLocal(prev => prev - produto.valor_total)
      }
      setLoadingId(null)
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setOrdemSelecao(prev => {
      const oldIndex = prev.indexOf(active.id as string)
      const newIndex = prev.indexOf(over.id as string)
      const novaOrdem = arrayMove(prev, oldIndex, newIndex)

      startTransition(async () => {
        const updates = novaOrdem
          .map((produtoId, index) => {
            const pp = lista.find(p => p.produto_id === produtoId)
            return pp ? { id: pp.id, ordem: index } : null
          })
          .filter(Boolean) as { id: string; ordem: number }[]
        await reordenarProdutos(updates)
      })

      return novaOrdem
    })
  }

  const selecionadosSet = new Set(ordemSelecao)
  const naoSelecionados = catalogo.filter(p => !selecionadosSet.has(p.id))
  const percentualUsado = limiteMax > 0 ? Math.min((totalLocal / limiteMax) * 100, 100) : 0

  if (catalogo.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
        <PackageOpen className="w-10 h-10 mb-2" />
        <p className="text-sm">Nenhum produto cadastrado no catálogo</p>
        <p className="text-xs mt-1">Peça ao ADM para cadastrar produtos nas Configurações</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Barra de orçamento */}
      <Card className="mb-3">
        <CardContent className="pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-500">Orçamento consumido</span>
            <span className="font-semibold">
              {formatCurrency(totalLocal)} / {formatCurrency(limiteMax)}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                percentualUsado >= 100 ? 'bg-red-500' :
                percentualUsado >= 80  ? 'bg-yellow-500' : 'bg-primary'
              }`}
              style={{ width: `${percentualUsado}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{percentualUsado.toFixed(1)}% do limite utilizado</p>
        </CardContent>
      </Card>

      {/* Produtos selecionados — arrastáveis */}
      {ordemSelecao.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ordemSelecao} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {ordemSelecao.map(produtoId => {
                const produto = catalogo.find(p => p.id === produtoId)
                if (!produto) return null
                const pp = lista.find(p => p.produto_id === produtoId)
                const isLoading = loadingId === produtoId || loadingId === pp?.id
                return (
                  <SortableProductCard
                    key={produtoId}
                    produto={produto}
                    isLoading={isLoading}
                    pending={pending}
                    onRemover={() => pp && handleRemover(pp.id, produto)}
                  />
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Separador */}
      {ordemSelecao.length > 0 && naoSelecionados.length > 0 && (
        <div className="flex items-center gap-2 py-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">Disponíveis para adicionar</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      )}

      {/* Produtos não selecionados */}
      {naoSelecionados.map(produto => {
        const isLoading = loadingId === produto.id
        return (
          <Card key={produto.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{produto.nome}</p>
                {produto.descricao && (
                  <p className="text-sm text-slate-500 mt-0.5">{produto.descricao}</p>
                )}
                {produto.valor_total > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(produto.valor_total)}</p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => handleAdicionar(produto)}
                disabled={isLoading || pending}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span className="ml-1">Adicionar</span>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
