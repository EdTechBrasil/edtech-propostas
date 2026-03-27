import { createClient } from '@/lib/supabase/server'
import { StepperNav } from '@/components/proposta/stepper-nav'

export default async function PropostaLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { count: produtosCount } = await supabase
    .from('proposta_produtos')
    .select('id', { count: 'exact', head: true })
    .eq('proposta_id', id)

  // Sem produtos: etapas 3-9 ficam bloqueadas no stepper
  const passoMaximo = (produtosCount ?? 0) > 0 ? 9 : 2

  return (
    <div className="flex flex-col min-h-full">
      <StepperNav propostaId={id} passoMaximo={passoMaximo} />
      <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">{children}</div>
    </div>
  )
}
