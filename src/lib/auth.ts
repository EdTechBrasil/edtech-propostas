import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Use em Server Components (pages).
 * Redireciona para /dashboard se o perfil não for permitido.
 */
export async function requirePerfil(...perfis: string[]): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single<{ perfil: string }>()

  if (!usuario || !perfis.includes(usuario.perfil)) {
    redirect('/dashboard')
  }

  return usuario.perfil
}

/**
 * Use em Server Actions.
 * Retorna string de erro se não autorizado, null se OK.
 */
export async function assertPerfil(...perfis: string[]): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Não autenticado'

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single<{ perfil: string }>()

  if (!usuario || !perfis.includes(usuario.perfil)) return 'Sem permissão'
  return null
}
