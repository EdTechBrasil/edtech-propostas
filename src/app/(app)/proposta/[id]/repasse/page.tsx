import { createClient } from '@/lib/supabase/server'
import { atualizarRepasse } from '@/lib/actions/proposta'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RepasseCliente } from './repasse-cliente'
import Link from 'next/link'

export default async function RepassePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: proposta }, { data: financeiro }] = await Promise.all([
    supabase
      .from('propostas')
      .select('id, repasse_tipo, repasse_valor')
      .eq('id', id)
      .single<{ id: string; repasse_tipo: string; repasse_valor: number }>(),
    supabase
      .from('proposta_financeiro')
      .select('receita_liquida')
      .eq('proposta_id', id)
      .single<{ receita_liquida: number }>(),
  ])

  if (!proposta) notFound()

  const { count: produtosCount } = await supabase
    .from('proposta_produtos')
    .select('id', { count: 'exact', head: true })
    .eq('proposta_id', id)

  if (!produtosCount || produtosCount === 0) redirect(`/proposta/${id}/produtos`)


  const action = atualizarRepasse.bind(null, id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Repasse</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure o repasse ao parceiro (opcional)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipo de repasse</CardTitle>
          <CardDescription>
            O repasse é contabilizado como custo adicional no cálculo da margem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action}>
            <RepasseCliente
              tipoInicial={proposta.repasse_tipo}
              valorInicial={proposta.repasse_valor}
              receitaLiquida={financeiro?.receita_liquida ?? 0}
            />
            <div className="flex justify-between mt-6">
              <Link href={`/proposta/${id}/descontos`}>
                <Button type="button" variant="outline">← Voltar</Button>
              </Link>
              <Button type="submit">Salvar e Continuar →</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
