import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicoCliente } from './publico-cliente'

export default async function PublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: proposta }, { data: prods }] = await Promise.all([
    supabase
      .from('propostas')
      .select(`
        id, orcamento_alvo, limite_orcamento_max,
        num_escolas, num_professores, num_alunos, num_temas,
        num_alunos_pre_i, num_alunos_pre_ii,
        num_alunos_ano1, num_alunos_ano2, num_alunos_ano3,
        num_temas_pre_i, num_temas_pre_ii,
        num_temas_ano1, num_temas_ano2, num_temas_ano3
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
      }>(),
    supabase
      .from('proposta_produtos')
      .select('produto:produtos(nome)')
      .eq('proposta_id', id),
  ])

  if (!proposta) notFound()

  const temMPC = (prods ?? []).some(p => (p.produto as any)?.nome?.includes('Primeiro'))

  return <PublicoCliente proposta={proposta} temMPC={temMPC} />
}
