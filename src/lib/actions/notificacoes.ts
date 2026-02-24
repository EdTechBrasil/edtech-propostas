'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function marcarTodasLidas() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  await supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('usuario_id', user.id)
    .eq('lida', false)

  revalidatePath('/')
  return { success: true }
}

// Chamado internamente por server actions (usa admin para inserir para outros usuários)
export async function criarNotificacao({
  usuario_id,
  proposta_id,
  tipo,
  mensagem,
}: {
  usuario_id: string
  proposta_id: string
  tipo: string
  mensagem: string
}) {
  const admin = createAdminClient()
  await admin.from('notificacoes').insert({ usuario_id, proposta_id, tipo, mensagem })
}

// Notifica todos os Gestores e ADMs
export async function notificarGestores(proposta_id: string, mensagem: string) {
  const admin = createAdminClient()
  const { data: gestores } = await admin
    .from('usuarios')
    .select('id')
    .in('perfil', ['Gestor', 'ADM'])

  if (!gestores || gestores.length === 0) return

  await admin.from('notificacoes').insert(
    gestores.map((g: { id: string }) => ({
      usuario_id: g.id,
      proposta_id,
      tipo: 'AprovacaoSolicitada',
      mensagem,
    }))
  )
}

// Notifica o criador da proposta
export async function notificarCriador(proposta_id: string, tipo: string, mensagem: string) {
  const admin = createAdminClient()
  const { data: proposta } = await admin
    .from('propostas')
    .select('criado_por_usuario_id')
    .eq('id', proposta_id)
    .single<{ criado_por_usuario_id: string }>()

  if (!proposta) return

  await admin.from('notificacoes').insert({
    usuario_id: proposta.criado_por_usuario_id,
    proposta_id,
    tipo,
    mensagem,
  })
}
