import { createAdminClient } from '@/lib/supabase/admin'
import { salvarConfiguracaoFinanceira } from '@/lib/actions/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Info } from 'lucide-react'

export default async function ConfiguracoesFinanceiras() {
  const adminClient = createAdminClient()

  const { data: config } = await adminClient
    .from('configuracao_financeira')
    .select('*')
    .eq('ativo', true)
    .single<{
      id: string
      margem_minima_percent: number
      margem_global_max_percent: number
      desconto_max_percent: number
    }>()

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configurações Financeiras</h1>
        <p className="text-slate-500 mt-1">Parâmetros globais que afetam o cálculo de todas as propostas</p>
      </div>

      <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 p-4 mb-6">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Atenção</p>
          <p className="mt-0.5">
            Alterações aqui afetam todas as novas propostas. Propostas existentes mantêm os valores usados na criação.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros globais</CardTitle>
          <CardDescription>
            Configure as margens e limites de desconto da empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={salvarConfiguracaoFinanceira as any} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="margem_minima_percent">Margem mínima aceitável (%)</Label>
              <p className="text-xs text-slate-400">
                Propostas abaixo deste valor precisarão de aprovação de Gestor ou ADM.
              </p>
              <div className="flex items-center gap-3 max-w-xs">
                <Input
                  id="margem_minima_percent"
                  name="margem_minima_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  defaultValue={config?.margem_minima_percent ?? 12}
                  className="text-right"
                  required
                />
                <span className="text-slate-500 font-medium">%</span>
              </div>
            </div>

            <div className="border-t pt-6 space-y-2">
              <Label htmlFor="margem_global_max_percent">Margem máxima global (%)</Label>
              <p className="text-xs text-slate-400">
                Define o limite máximo de orçamento: orçamento alvo × (1 + margem%).
              </p>
              <div className="flex items-center gap-3 max-w-xs">
                <Input
                  id="margem_global_max_percent"
                  name="margem_global_max_percent"
                  type="number"
                  min="0"
                  max="200"
                  step="0.1"
                  defaultValue={config?.margem_global_max_percent ?? 30}
                  className="text-right"
                  required
                />
                <span className="text-slate-500 font-medium">%</span>
              </div>
            </div>

            <div className="border-t pt-6 space-y-2">
              <Label htmlFor="desconto_max_percent">Desconto máximo permitido (%)</Label>
              <p className="text-xs text-slate-400">
                Nenhum desconto (global, produto ou componente) pode ultrapassar este valor.
              </p>
              <div className="flex items-center gap-3 max-w-xs">
                <Input
                  id="desconto_max_percent"
                  name="desconto_max_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  defaultValue={config?.desconto_max_percent ?? 20}
                  className="text-right"
                  required
                />
                <span className="text-slate-500 font-medium">%</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="lg">
                Salvar configurações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
