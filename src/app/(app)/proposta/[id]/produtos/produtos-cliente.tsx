'use client'

import { useState, useTransition } from 'react'
import { adicionarProduto, removerProduto } from '@/lib/actions/proposta'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Loader2, PackageOpen } from 'lucide-react'
import { formatCurrency } from '@/utils/format'

interface Produto {
  id: string
  nome: string
  descricao: string | null
  valor_total: number
}

interface PropostaProduto {
  id: string
  produto_id: string
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

export function ProdutosCliente({ propostaId, catalogo, selecionados, idsSelecionados, limiteMax, totalAtual }: Props) {
  const [pending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [lista, setLista] = useState(selecionados)

  // Ordem de seleção: IDs na sequência em que foram adicionados (mais recente no início)
  const [ordemSelecao, setOrdemSelecao] = useState<string[]>(idsSelecionados)

  // Valor total reativo
  const [totalLocal, setTotalLocal] = useState(totalAtual)

  function handleAdicionar(produto: Produto) {
    setLoadingId(produto.id)
    startTransition(async () => {
      const result = await adicionarProduto(propostaId, produto.id)
      if (!result?.error) {
        setOrdemSelecao(prev => [produto.id, ...prev])
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

  // Selecionados no topo (ordem de seleção: mais recente primeiro) + não selecionados embaixo
  const selecionadosSet = new Set(ordemSelecao)
  const catalogoOrdenado = [
    ...ordemSelecao.map(id => catalogo.find(p => p.id === id)).filter(Boolean) as Produto[],
    ...catalogo.filter(p => !selecionadosSet.has(p.id)),
  ]

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
      {/* Barra de orçamento — reativa */}
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

      {/* Lista de produtos: selecionados no topo */}
      {catalogoOrdenado.map((produto) => {
        const adicionado = selecionadosSet.has(produto.id)
        const pp = lista.find(p => p.produto_id === produto.id)
        const isLoading = loadingId === produto.id || loadingId === pp?.id

        return (
          <Card key={produto.id} className={adicionado ? 'border-primary/30 bg-primary/5' : ''}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">{produto.nome}</p>
                  {adicionado && (
                    <Badge variant="success" className="text-xs">Adicionado</Badge>
                  )}
                </div>
                {produto.descricao && (
                  <p className="text-sm text-slate-500 mt-0.5">{produto.descricao}</p>
                )}
                {produto.valor_total > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(produto.valor_total)}</p>
                )}
              </div>

              {adicionado ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => pp && handleRemover(pp.id, produto)}
                  disabled={isLoading || pending}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span className="ml-1">Remover</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleAdicionar(produto)}
                  disabled={isLoading || pending}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span className="ml-1">Adicionar</span>
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
