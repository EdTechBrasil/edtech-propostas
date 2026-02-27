import { createAdminClient } from '@/lib/supabase/admin'
import { ProdutosAdminCliente } from './produtos-cliente'

export default async function CatalogoProdutos() {
  const adminClient = createAdminClient()

  const { data: produtos } = await adminClient
    .from('produtos')
    .select(`
      id, nome, descricao, ativo,
      componentes:produto_componentes(id, nome, categoria, tipo_calculo, valor_venda_base, custo_interno_base, obrigatorio),
      servicos:produto_servicos(id, nome, tipo_calculo, valor_venda_base, custo_interno_base, obrigatorio)
    `)
    .order('ordem', { ascending: true, nullsFirst: false })
    .order('nome')

  return (
    <div className="p-8">
      <ProdutosAdminCliente produtos={(produtos ?? []) as any} />
    </div>
  )
}
