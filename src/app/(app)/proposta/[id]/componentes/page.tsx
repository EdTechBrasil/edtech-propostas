import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ComponentesCliente } from './componentes-cliente'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default async function ComponentesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: proposta } = await supabase
    .from('propostas')
    .select(`
      id, orcamento_alvo, limite_orcamento_max,
      num_professores, num_alunos, num_escolas, num_temas, num_kits, series_tapetes,
      num_temas_pre_i, num_temas_pre_ii,
      num_temas_ano1, num_temas_ano2, num_temas_ano3,
      num_alunos_pre_i, num_alunos_pre_ii,
      num_alunos_ano1, num_alunos_ano2, num_alunos_ano3,
      num_livros_guia
    `)
    .eq('id', id)
    .single<{
      id: string
      orcamento_alvo: number
      limite_orcamento_max: number
      num_professores: number
      num_alunos: number
      num_escolas: number
      num_temas: number
      num_kits: number
      series_tapetes: string | null
      num_temas_pre_i: number
      num_temas_pre_ii: number
      num_temas_ano1: number
      num_temas_ano2: number
      num_temas_ano3: number
      num_alunos_pre_i: number
      num_alunos_pre_ii: number
      num_alunos_ano1: number
      num_alunos_ano2: number
      num_alunos_ano3: number
      num_livros_guia: number
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
        componente:produto_componentes(id, nome, categoria, tipo_calculo, ordem)
      ),
      servicos:proposta_servicos(
        id, quantidade, valor_venda_unit, custo_interno_unit, desconto_percent, obrigatorio,
        servico:produto_servicos(id, nome, tipo_calculo, valor_venda_base, ordem)
      )
    `)
    .eq('proposta_id', id)

  const produtosOrdenados = (produtosProposta ?? []).map(pp => ({
    ...pp,
    componentes: [...(pp.componentes as any[])].sort(
      (a, b) => (a.componente?.ordem ?? 0) - (b.componente?.ordem ?? 0)
    ),
    servicos: [...(pp.servicos as any[])].sort(
      (a, b) => (a.servico?.ordem ?? 0) - (b.servico?.ordem ?? 0)
    ),
  }))

  const precisaPublico = produtosOrdenados.some(pp =>
    [...(pp.componentes as any[]), ...(pp.servicos as any[])].some(item => {
      const tc: string = item.componente?.tipo_calculo ?? item.servico?.tipo_calculo ?? ''
      if (tc === 'PorAluno'      && proposta.num_alunos === 0)      return true
      if (tc === 'PorProfessor'  && proposta.num_professores === 0) return true
      if (tc === 'PorEscola'     && proposta.num_escolas === 0)     return true
      if (tc === 'PorAlunoXTema'     && (proposta.num_alunos === 0 || proposta.num_temas === 0))     return true
      if (tc === 'PorProfessorXTema'      && (proposta.num_professores === 0 || proposta.num_temas === 0)) return true
      if (tc === 'PorAlunoEProfessorXTema' && (proposta.num_alunos === 0 || proposta.num_temas === 0))     return true
      if (tc === 'PorEscolaXKit' && (proposta.num_escolas === 0 || proposta.num_kits === 0))              return true
      return false
    })
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Componentes</h1>
        <p className="text-slate-500 mt-1">Ajuste quantidades e valores de cada componente</p>
      </div>

      {precisaPublico && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Dados do público não preenchidos</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Alguns itens estão com quantidade 1 por padrão. Preencha o Público para que
              as quantidades sejam calculadas automaticamente.
            </p>
          </div>
          <Link href={`/proposta/${id}/publico`}>
            <Button variant="outline" size="sm" className="text-amber-700 border-amber-300 hover:bg-amber-100 flex-shrink-0">
              Ir para Público →
            </Button>
          </Link>
        </div>
      )}

      {produtosOrdenados.length === 0 ? (
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
          numKits={proposta.num_kits ?? 5}
          seriesTapetes={proposta.series_tapetes ?? null}
          temasPorSerie={{
            PreI:  proposta.num_temas_pre_i  ?? 0,
            PreII: proposta.num_temas_pre_ii ?? 0,
            Ano1:  proposta.num_temas_ano1   ?? 0,
            Ano2:  proposta.num_temas_ano2   ?? 0,
            Ano3:  proposta.num_temas_ano3   ?? 0,
          }}
          alunosPorSerie={{
            PreI:  proposta.num_alunos_pre_i  ?? 0,
            PreII: proposta.num_alunos_pre_ii ?? 0,
            Ano1:  proposta.num_alunos_ano1   ?? 0,
            Ano2:  proposta.num_alunos_ano2   ?? 0,
            Ano3:  proposta.num_alunos_ano3   ?? 0,
          }}
          numLivrosGuia={proposta.num_livros_guia ?? 1}
          produtos={produtosOrdenados as any}
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
