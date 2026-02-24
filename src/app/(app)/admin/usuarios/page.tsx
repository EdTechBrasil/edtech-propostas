import { createAdminClient } from '@/lib/supabase/admin'
import { UsuariosCliente } from './usuarios-cliente'

export default async function GestaoUsuarios() {
  const adminClient = createAdminClient()

  const [{ data: authData }, { data: usuariosData }] = await Promise.all([
    adminClient.auth.admin.listUsers(),
    adminClient.from('usuarios').select('id, nome, perfil, ativo'),
  ])

  const usuarios = (authData?.users ?? []).map((u) => {
    const ud = (usuariosData ?? []).find((x: any) => x.id === u.id)
    return {
      id: u.id,
      email: u.email ?? '',
      nome: (ud as any)?.nome ?? '',
      perfil: (ud as any)?.perfil ?? 'Comercial',
      ativo: (ud as any)?.ativo ?? true,
    }
  })

  return (
    <div className="p-8">
      <UsuariosCliente usuarios={usuarios} />
    </div>
  )
}
