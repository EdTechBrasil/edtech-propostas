'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { notificarCriador } from './notificacoes'

export async function aprovarExcecao(proposta_id: string, observacao?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Verifica se é Gestor ou ADM
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single<{ perfil: string }>()

  if (!usuario || (usuario.perfil !== 'Gestor' && usuario.perfil !== 'ADM')) {
    return { error: 'Sem permissão para aprovar' }
  }

  // Atualiza status da proposta
  await supabase
    .from('propostas')
    .update({ status: 'Aprovada_excecao' })
    .eq('id', proposta_id)

  // Atualiza o registro de aprovação
  await supabase
    .from('aprovacao_excecao_margem')
    .update({
      aprovado_por_usuario_id: user.id,
      aprovado_em: new Date().toISOString(),
    })
    .eq('proposta_id', proposta_id)
    .is('aprovado_em', null)

  // Histórico
  await supabase.from('proposta_historico').insert({
    proposta_id,
    usuario_id: user.id,
    tipo_evento: 'AprovarExcecao',
    detalhes: observacao
      ? `Exceção aprovada por ${usuario.perfil}: ${observacao}`
      : `Exceção de margem aprovada por ${usuario.perfil}`,
  })

  await notificarCriador(proposta_id, 'PropostaAprovada', 'Sua proposta foi aprovada com exceção de margem.')

  revalidatePath('/aprovacao')
  revalidatePath(`/aprovacao/${proposta_id}`)
  revalidatePath(`/proposta/${proposta_id}/revisao`)
  return { success: true }
}

export async function rejeitarExcecao(proposta_id: string, motivo: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single<{ perfil: string }>()

  if (!usuario || (usuario.perfil !== 'Gestor' && usuario.perfil !== 'ADM')) {
    return { error: 'Sem permissão para rejeitar' }
  }

  // Devolve para rascunho para o Comercial revisar
  await supabase
    .from('propostas')
    .update({ status: 'Rascunho' })
    .eq('id', proposta_id)

  // Remove o pedido de aprovação para poder solicitar novamente
  await supabase
    .from('aprovacao_excecao_margem')
    .delete()
    .eq('proposta_id', proposta_id)
    .is('aprovado_em', null)

  // Histórico com motivo
  await supabase.from('proposta_historico').insert({
    proposta_id,
    usuario_id: user.id,
    tipo_evento: 'RejeitarExcecao',
    detalhes: motivo ? `Rejeitado: ${motivo}` : 'Exceção de margem rejeitada — proposta devolvida para revisão',
  })

  await notificarCriador(proposta_id, 'PropostaRejeitada',
    motivo ? `Proposta rejeitada: ${motivo}` : 'Sua proposta foi rejeitada e devolvida para revisão.')

  revalidatePath('/aprovacao')
  revalidatePath(`/aprovacao/${proposta_id}`)
  revalidatePath(`/proposta/${proposta_id}/revisao`)
  return { success: true }
}
