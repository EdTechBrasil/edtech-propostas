import { createClient } from '@/lib/supabase/server'
import { OrcamentoWizard } from './orcamento-wizard'

export default async function PropostaOrcamentoPage() {
  const supabase = await createClient()

  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, nome, tipo, descricao, prioridade_padrao')
    .eq('ativo', true)
    .order('nome')

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        <OrcamentoWizard produtos={produtos ?? []} />
      </div>
    </div>
  )
}
