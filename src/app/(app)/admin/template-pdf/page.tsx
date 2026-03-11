import { createAdminClient } from '@/lib/supabase/admin'
import { requirePerfil } from '@/lib/auth'
import { Info } from 'lucide-react'
import { TemplatePdfCliente } from './template-pdf-cliente'
import { createClient } from '@/lib/supabase/server'

export default async function TemplatePdfPage() {
  await requirePerfil('ADM')

  const adminClient = createAdminClient()

  const { data: config } = await adminClient
    .from('configuracao_pdf')
    .select('empresa_nome, proposta_titulo, proposta_subtitulo, logo_url, rodape_condicoes, css_customizado')
    .eq('ativo', true)
    .single<{
      empresa_nome: string
      proposta_titulo: string
      proposta_subtitulo: string
      logo_url: string | null
      rodape_condicoes: string | null
      css_customizado: string | null
    }>()

  // Busca uma proposta Pronta_pdf para o botão de exemplo
  const { data: propostaExemplo } = await adminClient
    .from('propostas')
    .select('id')
    .eq('status', 'Pronta_pdf')
    .limit(1)
    .single<{ id: string }>()

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Template PDF</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Personalize o layout das propostas geradas em PDF</p>
      </div>

      <div className="flex items-start gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800 p-4 mb-6">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">Dica</p>
          <p className="mt-0.5">
            As alterações são aplicadas imediatamente em todos os PDFs gerados a partir de propostas com status <strong>Pronta_pdf</strong>.
          </p>
        </div>
      </div>

      <TemplatePdfCliente config={config ?? null} propostaExemploId={propostaExemplo?.id} />
    </div>
  )
}
