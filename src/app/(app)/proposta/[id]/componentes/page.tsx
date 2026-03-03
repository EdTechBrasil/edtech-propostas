import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ComponentesCliente } from './componentes-cliente'
import Link from 'next/link'

export default async function ComponentesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: proposta } = await supabase
    .from('propostas')
    .select('id, orcamento_alvo, limite_orcamento_max, num_professores, num_alunos, num_escolas, num_temas')
    .eq('id', id)
    .single<{
      id: string
      orcamento_alvo: number
      limite_orcamento_max: number
      num_professores: number
      num_alunos: number
      num_escolas: number
      num_temas: number
    }>()

  if (!proposta) notFound()

  const { count: produtosCount } = await supabase
    .from('proposta_produtos')
    .select('id', { count: 'exact', head: true })
    .eq('proposta_id', id)

  if (!produtosCount || produtosCount === 0) redirect(`/proposta/${id}/produtos`)

  const { data: produtosProposta } = await supabase
    .from('proposta_produtos')
    .select(`
      id,
      produto_id,
      desconto_percent,
      produto:produtos(nome),
      componentes:proposta_componentes(
        id, quantidade, valor_venda_unit, custo_interno_unit, desconto_percent, obrigatorio,
        componente:produto_componentes(nome, categoria, tipo_calculo)
      ),
      servicos:proposta_servicos(
        id, quantidade, valor_venda_unit, custo_interno_unit, desconto_percent, obrigatorio,
        servico:produto_servicos(nome, tipo_calculo)
      )
    `)
    .eq('proposta_id', id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Componentes</h1>
        <p className="text-slate-500 mt-1">Ajuste quantidades e valores de cada componente</p>
      </div>

      {(!produtosProposta || produtosProposta.length === 0) ? (
        <div className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
          <p className="text-sm">Nenhum produto selecionado</p>
          <Link href={`/proposta/${id}/produtos`}>
            <Button variant="link" size="sm">← Voltar para produtos</Button>
          </Link>
        </div>
      ) : (
        <ComponentesCliente
          propostaId={id}
          limiteOrcamento={proposta.limite_orcamento_max ?? 0}
          numProfessores={proposta.num_professores ?? 0}
          numAlunos={proposta.num_alunos ?? 0}
          numEscolas={proposta.num_escolas ?? 0}
          numTemas={proposta.num_temas ?? 0}
          produtos={produtosProposta as any}
        />
      )}

      <div className="flex justify-between mt-6">
        <Link href={`/proposta/${id}/produtos`}>
          <Button variant="outline">← Voltar</Button>
        </Link>
        <Link href={`/proposta/${id}/descontos`}>
          <Button>Continuar →</Button>
        </Link>
      </div>
    </div>
  )
}
