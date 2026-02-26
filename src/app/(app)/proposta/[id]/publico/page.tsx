import { createClient } from '@/lib/supabase/server'
import { atualizarPublico } from '@/lib/actions/proposta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BackButton } from '@/components/ui/back-button'
import { formatCurrency } from '@/utils/format'
import { notFound } from 'next/navigation'

export default async function PublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: proposta } = await supabase
    .from('propostas')
    .select('id, orcamento_alvo, limite_orcamento_max, publico_descricao, num_escolas, num_alunos, num_professores')
    .eq('id', id)
    .single<{ id: string; orcamento_alvo: number; limite_orcamento_max: number; publico_descricao: string | null; num_escolas: number; num_alunos: number; num_professores: number }>()

  if (!proposta) notFound()

  const action = atualizarPublico.bind(null, id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Público</h1>
        <p className="text-slate-500 mt-1">Defina o público-alvo desta proposta</p>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
          <span className="text-slate-500">Orçamento alvo: </span>
          <span className="font-semibold">{formatCurrency(proposta.orcamento_alvo)}</span>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
          <span className="text-slate-500">Limite máximo: </span>
          <span className="font-semibold">{formatCurrency(proposta.limite_orcamento_max ?? 0)}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estrutura do público</CardTitle>
          <CardDescription>
            Informe as quantidades ou use a distribuição por série.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="escolas">Escolas</Label>
                <Input
                  id="escolas"
                  name="escolas"
                  type="number"
                  min="0"
                  placeholder="0"
                  defaultValue={proposta.num_escolas || proposta.publico_descricao?.match(/Escolas: (\d+)/)?.[1] || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alunos">Alunos</Label>
                <Input
                  id="alunos"
                  name="alunos"
                  type="number"
                  min="0"
                  placeholder="0"
                  defaultValue={proposta.num_alunos || proposta.publico_descricao?.match(/Alunos: (\d+)/)?.[1] || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professores">Professores</Label>
                <Input
                  id="professores"
                  name="professores"
                  type="number"
                  min="0"
                  placeholder="0"
                  defaultValue={proposta.num_professores || proposta.publico_descricao?.match(/Professores: (\d+)/)?.[1] || ''}
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">ou</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distribuicao">Distribuição por série (opcional)</Label>
              <Input
                id="distribuicao"
                name="distribuicao"
                placeholder="Ex: 1º ao 5º ano — 200 alunos; 6º ao 9º ano — 300 alunos"
                defaultValue={
                  proposta.publico_descricao?.startsWith('Distribuição por série:')
                    ? proposta.publico_descricao.replace('Distribuição por série: ', '')
                    : ''
                }
              />
              <p className="text-xs text-slate-400">
                Se preenchido, substitui os campos acima.
              </p>
            </div>

            <div className="flex justify-between">
              <BackButton />
              <Button type="submit">Continuar →</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
