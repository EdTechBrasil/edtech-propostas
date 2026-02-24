'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Usuários ──────────────────────────────────────────────────────────────────

export async function criarUsuario(formData: FormData) {
  const adminClient = createAdminClient()

  const nome = formData.get('nome') as string
  const email = formData.get('email') as string
  const senha = formData.get('senha') as string
  const perfil = formData.get('perfil') as string

  if (!nome || !email || !senha || !perfil) {
    return { error: 'Preencha todos os campos' }
  }

  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  })

  if (authError || !authUser.user) {
    return { error: authError?.message ?? 'Erro ao criar usuário' }
  }

  await new Promise(r => setTimeout(r, 500))

  await adminClient
    .from('usuarios')
    .upsert({ id: authUser.user.id, nome, perfil })

  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function atualizarPerfilUsuario(usuario_id: string, perfil: string) {
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('usuarios').update({ perfil }).eq('id', usuario_id)
  if (error) return { error: error.message }
  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function toggleAtivoUsuario(usuario_id: string, ativo: boolean) {
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('usuarios').update({ ativo }).eq('id', usuario_id)
  if (error) return { error: error.message }
  revalidatePath('/admin/usuarios')
  return { success: true }
}

// ── Configuração financeira ───────────────────────────────────────────────────

export async function salvarConfiguracaoFinanceira(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const margem_minima_percent = Number(formData.get('margem_minima_percent'))
  const margem_global_max_percent = Number(formData.get('margem_global_max_percent'))
  const desconto_max_percent = Number(formData.get('desconto_max_percent'))

  const adminClient = createAdminClient()

  const { data: existente } = await adminClient
    .from('configuracao_financeira')
    .select('id')
    .eq('ativo', true)
    .single<{ id: string }>()

  if (existente) {
    await adminClient
      .from('configuracao_financeira')
      .update({ margem_minima_percent, margem_global_max_percent, desconto_max_percent })
      .eq('id', existente.id)
  } else {
    await adminClient
      .from('configuracao_financeira')
      .insert({ margem_minima_percent, margem_global_max_percent, desconto_max_percent, ativo: true })
  }

  revalidatePath('/admin/configuracoes')
  return { success: true }
}

// ── Produtos ──────────────────────────────────────────────────────────────────

export async function criarProduto(formData: FormData) {
  const adminClient = createAdminClient()
  const nome = formData.get('nome') as string
  const descricao = formData.get('descricao') as string
  if (!nome) return { error: 'Nome é obrigatório' }
  const { data, error } = await adminClient
    .from('produtos')
    .insert({ nome, descricao: descricao || null, ativo: true })
    .select('id')
    .single<{ id: string }>()
  if (error || !data) return { error: error?.message ?? 'Erro ao criar produto' }
  revalidatePath('/admin/produtos')
  return { success: true, id: data.id }
}

export async function atualizarProduto(produto_id: string, formData: FormData) {
  const adminClient = createAdminClient()
  const nome = formData.get('nome') as string
  const descricao = formData.get('descricao') as string
  const { error } = await adminClient
    .from('produtos')
    .update({ nome, descricao: descricao || null })
    .eq('id', produto_id)
  if (error) return { error: error.message }
  revalidatePath('/admin/produtos')
  return { success: true }
}

export async function excluirProduto(produto_id: string) {
  const adminClient = createAdminClient()

  // Verifica se está em uso em propostas não canceladas
  const { data: usos } = await adminClient
    .from('proposta_produtos')
    .select('id, proposta:propostas(status)')
    .eq('produto_id', produto_id)

  const emPropostaAtiva = (usos ?? []).some((u: any) => u.proposta?.status !== 'Cancelada')
  if (emPropostaAtiva) {
    return { error: 'Este produto está em uso em propostas ativas. Desative-o em vez de excluir.' }
  }

  // Cascade manual: remove componentes e serviços de propostas canceladas
  if (usos && usos.length > 0) {
    const ppIds = usos.map((u: any) => u.id)
    await adminClient.from('proposta_componentes').delete().in('proposta_produto_id', ppIds)
    await adminClient.from('proposta_servicos').delete().in('proposta_produto_id', ppIds)
    await adminClient.from('proposta_produtos').delete().in('id', ppIds)
  }

  const { error } = await adminClient.from('produtos').delete().eq('id', produto_id)
  if (error) return { error: 'Erro ao excluir produto: ' + error.message }
  revalidatePath('/admin/produtos')
  return { success: true }
}

export async function toggleAtivoProduto(produto_id: string, ativo: boolean) {
  const adminClient = createAdminClient()
  await adminClient.from('produtos').update({ ativo }).eq('id', produto_id)
  revalidatePath('/admin/produtos')
  return { success: true }
}

// ── Componentes do produto ────────────────────────────────────────────────────

export async function criarComponenteProduto(formData: FormData) {
  const adminClient = createAdminClient()
  const produto_id = formData.get('produto_id') as string
  const nome = formData.get('nome') as string
  const categoria = formData.get('categoria') as string
  const tipo_calculo = formData.get('tipo_calculo') as string
  const valor_venda_base = Number(formData.get('valor_venda_base') || 0)
  const custo_interno_base = Number(formData.get('custo_interno_base') || 0)
  const obrigatorio = formData.get('obrigatorio') === 'true'
  if (!produto_id || !nome || !categoria || !tipo_calculo) {
    return { error: 'Campos obrigatórios não preenchidos' }
  }
  const { error } = await adminClient
    .from('produto_componentes')
    .insert({ produto_id, nome, categoria, tipo_calculo, valor_venda_base, custo_interno_base, obrigatorio, ativo: true })
  if (error) return { error: error.message }
  revalidatePath('/admin/produtos')
  return { success: true }
}

export async function atualizarComponenteProduto(componente_id: string, formData: FormData) {
  const adminClient = createAdminClient()
  const nome = formData.get('nome') as string
  const categoria = formData.get('categoria') as string
  const tipo_calculo = formData.get('tipo_calculo') as string
  const valor_venda_base = Number(formData.get('valor_venda_base') || 0)
  const custo_interno_base = Number(formData.get('custo_interno_base') || 0)
  const obrigatorio = formData.get('obrigatorio') === 'true'
  const { error } = await adminClient
    .from('produto_componentes')
    .update({ nome, categoria, tipo_calculo, valor_venda_base, custo_interno_base, obrigatorio })
    .eq('id', componente_id)
  if (error) return { error: error.message }
  revalidatePath('/admin/produtos')
  return { success: true }
}

export async function excluirComponenteProduto(componente_id: string) {
  const adminClient = createAdminClient()
  await adminClient.from('produto_componentes').delete().eq('id', componente_id)
  revalidatePath('/admin/produtos')
  return { success: true }
}

// ── Serviços do produto ───────────────────────────────────────────────────────

export async function criarServicoProduto(formData: FormData) {
  const adminClient = createAdminClient()
  const produto_id = formData.get('produto_id') as string
  const nome = formData.get('nome') as string
  const tipo_calculo = formData.get('tipo_calculo') as string
  const valor_venda_base = Number(formData.get('valor_venda_base') || 0)
  const custo_interno_base = Number(formData.get('custo_interno_base') || 0)
  const obrigatorio = formData.get('obrigatorio') === 'true'
  if (!produto_id || !nome || !tipo_calculo) {
    return { error: 'Campos obrigatórios não preenchidos' }
  }
  const { error } = await adminClient
    .from('produto_servicos')
    .insert({ produto_id, nome, tipo_calculo, valor_venda_base, custo_interno_base, obrigatorio, ativo: true })
  if (error) return { error: error.message }
  revalidatePath('/admin/produtos')
  return { success: true }
}

export async function atualizarServicoProduto(servico_id: string, formData: FormData) {
  const adminClient = createAdminClient()
  const nome = formData.get('nome') as string
  const tipo_calculo = formData.get('tipo_calculo') as string
  const valor_venda_base = Number(formData.get('valor_venda_base') || 0)
  const custo_interno_base = Number(formData.get('custo_interno_base') || 0)
  const obrigatorio = formData.get('obrigatorio') === 'true'
  const { error } = await adminClient
    .from('produto_servicos')
    .update({ nome, tipo_calculo, valor_venda_base, custo_interno_base, obrigatorio })
    .eq('id', servico_id)
  if (error) return { error: error.message }
  revalidatePath('/admin/produtos')
  return { success: true }
}

export async function excluirServicoProduto(servico_id: string) {
  const adminClient = createAdminClient()
  await adminClient.from('produto_servicos').delete().eq('id', servico_id)
  revalidatePath('/admin/produtos')
  return { success: true }
}
