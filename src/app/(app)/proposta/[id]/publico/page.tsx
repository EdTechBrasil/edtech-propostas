import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicoCliente } from './publico-cliente'

export default async function PublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: proposta }, { data: prods }, { data: allServicos }] = await Promise.all([
    supabase
      .from('propostas')
      .select(`
        id, orcamento_alvo, limite_orcamento_max,
        num_escolas, num_professores, num_alunos, num_temas,
        num_alunos_pre_i, num_alunos_pre_ii,
        num_alunos_ano1, num_alunos_ano2, num_alunos_ano3,
        num_temas_pre_i, num_temas_pre_ii,
        num_temas_ano1, num_temas_ano2, num_temas_ano3,
        num_alunos_ano4, num_alunos_ano5, num_alunos_ano6,
        num_alunos_ano7, num_alunos_ano8, num_alunos_ano9,
        num_temas_ano4, num_temas_ano5, num_temas_ano6,
        num_temas_ano7, num_temas_ano8, num_temas_ano9
      `)
      .eq('id', id)
      .single<{
        id: string
        orcamento_alvo: number
        limite_orcamento_max: number
        num_escolas: number
        num_professores: number
        num_alunos: number
        num_temas: number
        num_alunos_pre_i: number
        num_alunos_pre_ii: number
        num_alunos_ano1: number
        num_alunos_ano2: number
        num_alunos_ano3: number
        num_temas_pre_i: number
        num_temas_pre_ii: number
        num_temas_ano1: number
        num_temas_ano2: number
        num_temas_ano3: number
        num_alunos_ano4: number
        num_alunos_ano5: number
        num_alunos_ano6: number
        num_alunos_ano7: number
        num_alunos_ano8: number
        num_alunos_ano9: number
        num_temas_ano4: number
        num_temas_ano5: number
        num_temas_ano6: number
        num_temas_ano7: number
        num_temas_ano8: number
        num_temas_ano9: number
      }>(),
    supabase
      .from('proposta_produtos')
      .select('produto:produtos(nome)')
      .eq('proposta_id', id),
    supabase
      .from('proposta_servicos')
      .select('id, quantidade, valor_venda_unit, servico:produto_servicos(nome)')
      .eq('proposta_id', id),
  ])

  if (!proposta) notFound()

  const temMPC    = (prods ?? []).some(p => (p.produto as any)?.nome?.includes('Primeiro'))
  const temCoding = (prods ?? []).some(p => (p.produto as any)?.nome?.includes('Coding'))

  const servicoPresencial = (allServicos ?? []).find(s =>
    (s.servico as any)?.nome?.toLowerCase().includes('presencial')) ?? null
  const servicoEAD = (allServicos ?? []).find(s =>
    (s.servico as any)?.nome?.toLowerCase().includes('ead')) ?? null
  const servicoAssessoria = (allServicos ?? []).find(s =>
    (s.servico as any)?.nome?.toLowerCase().includes('assessoria')) ?? null

  const servicosFormacao = {
    presencial: servicoPresencial ? { id: servicoPresencial.id, quantidade: servicoPresencial.quantidade, valor_venda_unit: servicoPresencial.valor_venda_unit } : null,
    ead: servicoEAD ? { id: servicoEAD.id, quantidade: servicoEAD.quantidade, valor_venda_unit: servicoEAD.valor_venda_unit } : null,
    assessoria: servicoAssessoria ? { id: servicoAssessoria.id, quantidade: servicoAssessoria.quantidade, valor_venda_unit: servicoAssessoria.valor_venda_unit } : null,
  }

  return <PublicoCliente proposta={proposta} temMPC={temMPC} temCoding={temCoding} servicosFormacao={servicosFormacao} />
}
