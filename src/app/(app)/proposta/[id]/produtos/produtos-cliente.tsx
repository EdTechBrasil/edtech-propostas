'use client'

import { useState, useTransition } from 'react'
import { adicionarProduto, removerProduto } from '@/lib/actions/proposta'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Loader2, PackageOpen } from 'lucide-react'

interface Produto {
  id: string
  nome: string
  descricao: string | null
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
  const [selecionadosLocais, setSelecionadosLocais] = useState<Set<string>>(new Set(idsSelecionados))
  const [lista, setLista] = useState(selecionados)

  function handleAdicionar(produto_id: string) {
    setLoadingId(produto_id)
    startTransition(async () => {
      const result = await adicionarProduto(propostaId, produto_id)
      if (!result?.error) {
        setSelecionadosLocais(prev => new Set([...prev, produto_id]))
      }
      setLoadingId(null)
    })
  }

  function handleRemover(proposta_produto_id: string, produto_id: string) {
    setLoadingId(proposta_produto_id)
    startTransition(async () => {
      const result = await removerProduto(proposta_produto_id, propostaId)
      if (!result?.error) {
        setSelecionadosLocais(prev => {
          const next = new Set(prev)
          next.delete(produto_id)
          return next
        })
        setLista(prev => prev.filter(p => p.id !== proposta_produto_id))
      }
      setLoadingId(null)
    })
  }

  return (
    <div className="space-y-3">
      {catalogo.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
          <PackageOpen className="w-10 h-10 mb-2" />
          <p className="text-sm">Nenhum produto cadastrado no catálogo</p>
          <p className="text-xs mt-1">Peça ao ADM para cadastrar produtos nas Configurações</p>
        </div>
      ) : (
        catalogo.map((produto) => {
          const adicionado = selecionadosLocais.has(produto.id)
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
                </div>

                {adicionado ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => pp && handleRemover(pp.id, produto.id)}
                    disabled={isLoading || pending}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span className="ml-1">Remover</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleAdicionar(produto.id)}
                    disabled={isLoading || pending}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span className="ml-1">Adicionar</span>
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
