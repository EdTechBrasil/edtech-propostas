import { createAdminClient } from '@/lib/supabase/admin'
import { requirePerfil } from '@/lib/auth'
import { ProdutosAdminCliente } from './produtos-cliente'

export default async function CatalogoProdutos() {
  await requirePerfil('ADM')

  const adminClient = createAdminClient()

  const { data: produtos } = await adminClient
    .from('produtos')
    .select(`
      id, nome, descricao, ativo,
      series:produto_series(serie),
      componentes:produto_componentes(id, nome, categoria, tipo_calculo, valor_venda_base, custo_interno_base, obrigatorio),
      servicos:produto_servicos(id, nome, tipo_calculo, valor_venda_base, custo_interno_base, obrigatorio)
    `)
    .order('ordem', { ascending: true, nullsFirst: false })
    .order('nome')

  const produtosNormalizados = (produtos ?? []).map((p: any) => ({
    ...p,
    series: (p.series as { serie: string }[] ?? []).map((s) => s.serie),
  }))

  return (
    <div className="p-4 md:p-8">
      <ProdutosAdminCliente produtos={produtosNormalizados as any} />
    </div>
  )
}
