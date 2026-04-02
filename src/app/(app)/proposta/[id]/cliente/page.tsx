import { createClient } from '@/lib/supabase/server'
import { atualizarDadosCliente, gerarPDFProposta } from '@/lib/actions/proposta'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const hoje = new Date().toISOString().split('T')[0]
  const supabase = await createClient()

  const { data: proposta } = await supabase
    .from('propostas')
    .select('id, status, cliente_nome_instituicao, cliente_cnpj, cliente_responsavel, cliente_email, cliente_cidade, validade_proposta')
    .eq('id', id)
    .single<{
      id: string
      status: string
      cliente_nome_instituicao: string | null
      cliente_cnpj: string | null
      cliente_responsavel: string | null
      cliente_email: string | null
      cliente_cidade: string | null
      validade_proposta: string | null
    }>()

  if (!proposta) notFound()

  const bloqueado = proposta.status === 'Aguardando_aprovacao'
  const actionSalvar = atualizarDadosCliente.bind(null, id)
  const actionPDF = gerarPDFProposta.bind(null, id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dados do Cliente</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Preencha os dados do cliente para geração do PDF</p>
      </div>

      {bloqueado && (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 mb-6 text-sm text-yellow-700 dark:text-yellow-300">
          Esta proposta está aguardando aprovação de margem. O PDF só poderá ser gerado após a autorização.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informações da instituição</CardTitle>
          <CardDescription>Preencha os dados do cliente para gerar o PDF.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={actionSalvar} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="nome_instituicao">Nome da instituição</Label>
                <Input
                  id="nome_instituicao"
                  name="nome_instituicao"
                  placeholder="Secretaria Municipal de Educação de..."
                  defaultValue={proposta.cliente_nome_instituicao ?? ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  name="cnpj"
                  placeholder="00.000.000/0000-00"
                  defaultValue={proposta.cliente_cnpj ?? ''}
                  maxLength={18}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  name="cidade"
                  placeholder="São Paulo — SP"
                  defaultValue={proposta.cliente_cidade ?? ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  name="responsavel"
                  placeholder="Nome do responsável"
                  defaultValue={proposta.cliente_responsavel ?? ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contato@prefeitura.gov.br"
                  defaultValue={proposta.cliente_email ?? ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validade">Validade da proposta</Label>
                <Input
                  id="validade"
                  name="validade"
                  type="date"
                  defaultValue={proposta.validade_proposta ?? ''}
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Link href={`/proposta/${id}/revisao`}>
                <Button type="button" variant="outline">← Voltar</Button>
              </Link>
              <div className="flex gap-3">
                <Button type="submit" variant="outline">
                  Salvar dados
                </Button>
                <Button
                  type="submit"
                  formAction={actionPDF}
                  disabled={bloqueado}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {bloqueado ? 'Aguardando aprovação' : 'Gerar PDF'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
