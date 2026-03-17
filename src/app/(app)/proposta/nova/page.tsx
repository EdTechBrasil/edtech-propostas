import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, ListChecks, Target } from 'lucide-react'

export default function NovaProposta() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Nova Proposta</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Escolha como deseja criar a proposta</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/proposta/livre" className="group">
            <Card className="h-full transition-all hover:border-primary hover:shadow-md cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <ListChecks className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="mt-3">Proposta Livre</CardTitle>
                <CardDescription>
                  Configure manualmente os produtos, público e componentes da proposta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ideal quando você já sabe exatamente quais produtos incluir e tem controle total sobre cada detalhe.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/proposta/orcamento" className="group">
            <Card className="h-full transition-all hover:border-primary hover:shadow-md cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="mt-3">Proposta por Orçamento</CardTitle>
                <CardDescription>
                  Defina orçamento, público e projetos — o sistema gera a proposta automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ideal para explorar rapidamente o que cabe no orçamento do cliente e já partir para revisão.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
