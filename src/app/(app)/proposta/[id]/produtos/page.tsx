import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ProdutosCliente } from './produtos-cliente'
import Link from 'next/link'

function qtdSugerida(tipo: string, numEsc: number, numAlun: number, numProf: number, numTemas: number): number {
  if (tipo === 'PorProfessor'     && numProf > 0) return numProf
  if (tipo === 'PorAluno'         && numAlun > 0) return numAlun
  if (tipo === 'PorEscola'        && numEsc  > 0) return numEsc
  if (tipo === 'PorAlunoXTema'    && numAlun > 0 && numTemas > 0) return numAlun * numTemas
  if (tipo === 'PorProfessorXTema'      && numProf > 0 && numTemas > 0) return numProf * numTemas
  if (tipo === 'PorAlunoEProfessorXTema' && (numAlun > 0 || numProf > 0) && numTemas > 0) return (numAlun + numProf) * numTemas
  return 1
}

export default async function ProdutosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: proposta }, { data: catalogo }, { data: selecionados }] = await Promise.all([
    supabase
      .from('propostas')
      .select('id, orcamento_alvo, limite_orcamento_max, num_escolas, num_alunos, num_professores, num_temas')
      .eq('id', id)
      .single<{
        id: string
        orcamento_alvo: number
        limite_orcamento_max: number
        num_escolas: number
        num_alunos: number
        num_professores: number
        num_temas: number
      }>(),
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

  // Valor atual (componentes já salvos)
  const { data: totalComp } = await supabase
    .from('proposta_componentes')
    .select('quantidade, valor_venda_unit')
    .eq('proposta_id', id)

  const totalAtual = (totalComp ?? []).reduce(
    (sum: number, c: any) => sum + c.quantidade * c.valor_venda_unit,
    0
  )

  // Valor estimado por produto (para atualizar barra em tempo real)
  const catalogoIds = (catalogo ?? []).map((p: any) => p.id)
  const { data: componentes } = catalogoIds.length > 0
    ? await supabase
        .from('produto_componentes')
        .select('produto_id, tipo_calculo, valor_venda_base')
        .in('produto_id', catalogoIds)
        .eq('ativo', true)
    : { data: [] }

  const valorPorProduto: Record<string, number> = {}
  for (const c of (componentes ?? []) as any[]) {
    valorPorProduto[c.produto_id] = (valorPorProduto[c.produto_id] ?? 0) +
      qtdSugerida(c.tipo_calculo, proposta.num_escolas ?? 0, proposta.num_alunos ?? 0, proposta.num_professores ?? 0, proposta.num_temas ?? 0) *
      c.valor_venda_base
  }

  const catalogoComValor = (catalogo ?? []).map((p: any) => ({
    ...p,
    valor_total: valorPorProduto[p.id] ?? 0,
  }))

  const idsSelecionados = (selecionados ?? []).map((p: any) => p.produto_id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
        <p className="text-slate-500 mt-1">Selecione os produtos para compor a proposta</p>
      </div>

      <ProdutosCliente
        propostaId={id}
        catalogo={catalogoComValor}
        selecionados={(selecionados ?? []) as any}
        idsSelecionados={idsSelecionados}
        limiteMax={proposta.limite_orcamento_max}
        totalAtual={totalAtual}
      />

      <div className="flex justify-end mt-6">
        <Link href={`/proposta/${id}/publico`}>
          <Button disabled={(selecionados ?? []).length === 0}>
            Continuar →
          </Button>
        </Link>
      </div>
    </div>
  )
}
