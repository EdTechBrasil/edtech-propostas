import { createClient } from '@/lib/supabase/server'
import { atualizarDescontos } from '@/lib/actions/proposta'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Info } from 'lucide-react'
import Link from 'next/link'

export default async function DescontosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: proposta }, { data: config }, { data: produtos }] = await Promise.all([
    supabase
      .from('propostas')
      .select('id, desconto_global_percent')
      .eq('id', id)
      .single<{ id: string; desconto_global_percent: number }>(),
    supabase
      .from('configuracao_financeira')
      .select('desconto_max_percent')
      .eq('ativo', true)
      .single<{ desconto_max_percent: number }>(),
    supabase
      .from('proposta_produtos')
      .select(`
        id, desconto_percent,
        produto:produtos(nome),
        componentes:proposta_componentes(id, desconto_percent, componente:produto_componentes(nome))
      `)
      .eq('proposta_id', id),
  ])

  if (!proposta) notFound()
  if (!produtos || produtos.length === 0) redirect(`/proposta/${id}/produtos`)

  const desconto_max = config?.desconto_max_percent ?? 20
  const action = atualizarDescontos.bind(null, id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Descontos</h1>
        <p className="text-slate-500 mt-1">Configure descontos por nível. O mais específico prevalece.</p>
      </div>

      <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-100 p-4 mb-6">
        <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-700">
          <p className="font-medium">Regra de precedência</p>
          <p className="mt-0.5">
            Desconto do componente {'>'} desconto do produto {'>'} desconto global.
            Limite máximo: <strong>{desconto_max}%</strong>
          </p>
        </div>
      </div>

      <form action={action} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Desconto global da proposta</CardTitle>
            <CardDescription>Aplicado a todos os itens que não têm desconto específico.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 max-w-xs">
              <Input
                name="desconto_global"
                type="number"
                min="0"
                max={desconto_max}
                step="0.1"
                defaultValue={proposta.desconto_global_percent}
                className="text-right"
              />
              <span className="text-slate-500 font-medium">%</span>
            </div>
          </CardContent>
        </Card>

        {(produtos ?? []).map((pp: any) => (
          <Card key={pp.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{pp.produto?.nome}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Label className="w-40 text-slate-600 text-sm">Desconto do produto</Label>
                <div className="flex items-center gap-2">
                  <Input
                    name={`desconto_produto_${pp.id}`}
                    type="number"
                    min="0"
                    max={desconto_max}
                    step="0.1"
                    defaultValue={pp.desconto_percent}
                    className="w-24 text-right"
                  />
                  <span className="text-slate-500">%</span>
                </div>
              </div>

              {(pp.componentes ?? []).length > 0 && (
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Por componente</p>
                  {pp.componentes.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <Label className="w-40 text-sm text-slate-600 truncate">{c.componente?.nome}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          name={`desconto_comp_${c.id}`}
                          type="number"
                          min="0"
                          max={desconto_max}
                          step="0.1"
                          defaultValue={c.desconto_percent}
                          className="w-24 text-right"
                        />
                        <span className="text-slate-500">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-between">
          <Link href={`/proposta/${id}/componentes`}>
            <Button type="button" variant="outline">← Voltar</Button>
          </Link>
          <Button type="submit">Aplicar e Continuar →</Button>
        </div>
      </form>
    </div>
  )
}
