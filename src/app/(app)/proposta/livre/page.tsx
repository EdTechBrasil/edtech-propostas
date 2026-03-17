import { createClient } from '@/lib/supabase/server'
import { criarProposta } from '@/lib/actions/proposta'
import { StepperNav } from '@/components/proposta/stepper-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Info } from 'lucide-react'

export default async function PropostaLivre() {
  const supabase = await createClient()

  const { data: config } = await supabase
    .from('configuracao_financeira')
    .select('margem_global_max_percent')
    .eq('ativo', true)
    .single<{ margem_global_max_percent: number }>()

  const margem = config?.margem_global_max_percent ?? 30

  return (
    <div className="flex flex-col min-h-full">
      <StepperNav />
      <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Nova Proposta</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Defina o orçamento alvo da proposta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Orçamento</CardTitle>
            <CardDescription>
              O limite máximo será calculado automaticamente com base na margem global configurada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={criarProposta as any} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="orcamento_alvo">Orçamento alvo (R$)</Label>
                <CurrencyInput
                  name="orcamento_alvo"
                  className="text-lg"
                />
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800 p-4">
                <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Limite máximo de orçamento</p>
                  <p className="mt-0.5">
                    O total da proposta não pode ultrapassar o orçamento alvo multiplicado por{' '}
                    <strong>{(1 + margem / 100).toFixed(2)}x</strong> (margem global de {margem}%).
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="lg">
                  Continuar →
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
