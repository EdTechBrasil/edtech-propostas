import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/format'
import { ProdutosCliente } from './produtos-cliente'
import Link from 'next/link'

export default async function ProdutosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: proposta }, { data: catalogo }, { data: selecionados }] = await Promise.all([
    supabase
      .from('propostas')
      .select('id, orcamento_alvo, limite_orcamento_max')
      .eq('id', id)
      .single<{ id: string; orcamento_alvo: number; limite_orcamento_max: number }>(),
    supabase
      .from('produtos')
      .select('id, nome, descricao')
      .eq('ativo', true)
      .order('nome'),
    supabase
      .from('proposta_produtos')
      .select('id, produto_id, produto:produtos(nome)')
      .eq('proposta_id', id),
  ])

  if (!proposta) notFound()

  const { data: totalComp } = await supabase
    .from('proposta_componentes')
    .select('quantidade, valor_venda_unit')
    .eq('proposta_id', id)

  const totalAtual = (totalComp ?? []).reduce(
    (sum: number, c: any) => sum + c.quantidade * c.valor_venda_unit,
    0
  )

  const percentualUsado = proposta.limite_orcamento_max > 0
    ? Math.min((totalAtual / proposta.limite_orcamento_max) * 100, 100)
    : 0

  const idsSelecionados = new Set((selecionados ?? []).map((p: any) => p.produto_id))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
        <p className="text-slate-500 mt-1">Selecione os produtos para compor a proposta</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-500">Orçamento consumido</span>
            <span className="font-semibold">
              {formatCurrency(totalAtual)} / {formatCurrency(proposta.limite_orcamento_max)}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                percentualUsado >= 100 ? 'bg-red-500' :
                percentualUsado >= 80 ? 'bg-yellow-500' : 'bg-primary'
              }`}
              style={{ width: `${percentualUsado}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{percentualUsado.toFixed(1)}% do limite utilizado</p>
        </CardContent>
      </Card>

      <ProdutosCliente
        propostaId={id}
        catalogo={catalogo ?? []}
        selecionados={(selecionados ?? []) as any}
        idsSelecionados={[...idsSelecionados]}
        limiteMax={proposta.limite_orcamento_max}
        totalAtual={totalAtual}
      />

      <div className="flex justify-between mt-6">
        <Link href={`/proposta/${id}/publico`}>
          <Button variant="outline">← Voltar</Button>
        </Link>
        <Link href={`/proposta/${id}/componentes`}>
          <Button disabled={(selecionados ?? []).length === 0}>
            Continuar →
          </Button>
        </Link>
      </div>
    </div>
  )
}
