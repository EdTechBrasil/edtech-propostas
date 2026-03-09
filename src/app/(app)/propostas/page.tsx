import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PropostasCliente } from './propostas-cliente'

export default async function PropostasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nome, perfil')
    .eq('id', user.id)
    .single<{ nome: string; perfil: string }>()

  const perfil = usuario?.perfil ?? 'Comercial'
  const podeVerTodas = perfil === 'Gestor' || perfil === 'ADM'

  let query = supabase
    .from('propostas')
    .select(`
      id,
      orcamento_alvo,
      status,
      criado_em,
      cliente_nome_instituicao,
      criador:usuarios!criado_por_usuario_id(nome)
    `)
    .order('ordem', { ascending: true, nullsFirst: false })
    .order('criado_em', { ascending: false })

  if (!podeVerTodas) {
    query = query.eq('criado_por_usuario_id', user.id)
  }

  const { data: propostas } = await query

  const propostasFormatadas = (propostas ?? []).map((p: any) => ({
    id: p.id,
    orcamento_alvo: p.orcamento_alvo,
    status: p.status,
    criado_em: p.criado_em,
    cliente_nome_instituicao: p.cliente_nome_instituicao,
    criador_nome: p.criador?.nome ?? '—',
    perfil_atual: perfil,
  }))

  return (
    <PropostasCliente
      propostas={propostasFormatadas}
      usuario={{ nome: usuario?.nome ?? '', perfil }}
    />
  )
}
