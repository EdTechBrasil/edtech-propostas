'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { salvarConfiguracaoPdf, uploadLogoPdf, uploadTemplatePdf } from '@/lib/actions/admin'
import { Upload, Loader2, Check, AlertCircle, FileText, ExternalLink, X } from 'lucide-react'

type Config = {
  empresa_nome: string
  proposta_titulo: string
  proposta_subtitulo: string
  logo_url: string | null
  rodape_condicoes: string | null
  css_customizado: string | null
  template_pdf_url: string | null
}

export function TemplatePdfCliente({ config, propostaExemploId }: { config: Config | null; propostaExemploId?: string }) {
  const [logoUrl, setLogoUrl] = useState(config?.logo_url ?? '')
  const [templatePdfUrl, setTemplatePdfUrl] = useState(config?.template_pdf_url ?? '')
  const [templatePdfNome, setTemplatePdfNome] = useState('')
  const [uploadandoLogo, setUploadandoLogo] = useState(false)
  const [uploadandoTemplate, setUploadandoTemplate] = useState(false)
  const [uploadErroLogo, setUploadErroLogo] = useState('')
  const [uploadErroTemplate, setUploadErroTemplate] = useState('')
  const [salvando, startSalvar] = useTransition()
  const [salvoOk, setSalvoOk] = useState(false)
  const [salvoErro, setSalvoErro] = useState('')
  const logoFileRef = useRef<HTMLInputElement>(null)
  const templateFileRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadandoLogo(true)
    setUploadErroLogo('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadLogoPdf(fd)
    setUploadandoLogo(false)
    if (res && 'url' in res && res.url) {
      setLogoUrl(res.url)
    } else if (res && 'error' in res) {
      setUploadErroLogo(res.error ?? 'Erro ao fazer upload')
    }
  }

  async function handleTemplateUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadandoTemplate(true)
    setUploadErroTemplate('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadTemplatePdf(fd)
    setUploadandoTemplate(false)
    if (res && 'url' in res && res.url) {
      setTemplatePdfUrl(res.url)
      setTemplatePdfNome(file.name)
    } else if (res && 'error' in res) {
      setUploadErroTemplate(res.error ?? 'Erro ao fazer upload')
    }
  }

  function handleSubmit(formData: FormData) {
    setSalvoOk(false)
    setSalvoErro('')
    formData.set('logo_url', logoUrl)
    formData.set('template_pdf_url', templatePdfUrl)
    startSalvar(async () => {
      const res = await salvarConfiguracaoPdf(formData)
      if (res && 'success' in res) {
        setSalvoOk(true)
        setTimeout(() => setSalvoOk(false), 3000)
      } else if (res && 'error' in res) {
        setSalvoErro((res as any).error ?? 'Erro ao salvar')
      }
    })
  }

  const templateNomeExibido = templatePdfNome || (templatePdfUrl ? templatePdfUrl.split('/').pop() : '')

  return (
    <form action={handleSubmit} className="space-y-6">

      {/* Logo — destaque */}
      <Card>
        <CardHeader>
          <CardTitle>Logo da empresa</CardTitle>
          <CardDescription>Aparece no cabeçalho da apresentação e do PDF.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="relative w-40 h-16 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-40 h-16 rounded-md border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                Sem logo
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => logoFileRef.current?.click()}
                disabled={uploadandoLogo}
                className="gap-2"
              >
                {uploadandoLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadandoLogo ? 'Enviando…' : logoUrl ? 'Trocar logo' : 'Enviar logo'}
              </Button>
              {logoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 text-xs"
                  onClick={() => setLogoUrl('')}
                >
                  Remover
                </Button>
              )}
              {uploadErroLogo && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {uploadErroLogo}
                </p>
              )}
            </div>
          </div>
          <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </CardContent>
      </Card>

      {/* Template PDF — ação principal */}
      <Card className="border-2 border-indigo-100 bg-indigo-50/30">
        <CardHeader>
          <CardTitle className="text-indigo-900">PDF timbrado (template de fundo)</CardTitle>
          <CardDescription>
            Faça upload do PDF com o papel timbrado da empresa. Ele será renderizado como fundo de cada proposta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              {templatePdfUrl ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-indigo-200 bg-white">
                  <FileText className="w-8 h-8 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{templateNomeExibido}</p>
                    <a
                      href={templatePdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <ExternalLink className="w-3 h-3" /> Visualizar PDF
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-red-500"
                    onClick={() => { setTemplatePdfUrl(''); setTemplatePdfNome('') }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed border-indigo-200 bg-white text-slate-400 text-sm">
                  Nenhum template configurado
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              onClick={() => templateFileRef.current?.click()}
              disabled={uploadandoTemplate}
            >
              {uploadandoTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadandoTemplate ? 'Enviando…' : templatePdfUrl ? 'Substituir PDF' : 'Enviar PDF timbrado'}
            </Button>
            {uploadErroTemplate && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {uploadErroTemplate}
              </p>
            )}
          </div>

          <input ref={templateFileRef} type="file" accept="application/pdf" className="hidden" onChange={handleTemplateUpload} />
          <input type="hidden" name="template_pdf_url" value={templatePdfUrl} />

          {propostaExemploId && templatePdfUrl && (
            <p className="text-xs text-indigo-600">
              <a
                href={`/proposta/${propostaExemploId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-indigo-800"
              >
                Ver proposta de exemplo com o template →
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Personalização avançada (colapsável) */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700 select-none list-none flex items-center gap-2 py-2">
          <span className="text-slate-400 group-open:rotate-90 transition-transform inline-block">▶</span>
          Personalização avançada (identidade, títulos, rodapé, CSS)
        </summary>
        <div className="mt-4 space-y-6">

          <Card>
            <CardHeader>
              <CardTitle>Identidade da empresa</CardTitle>
              <CardDescription>Nome e logo que aparecem no cabeçalho do PDF.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="empresa_nome">Nome da empresa</Label>
                <Input
                  id="empresa_nome"
                  name="empresa_nome"
                  defaultValue={config?.empresa_nome ?? 'EdTech Brasil'}
                  required
                />
              </div>

              <input type="hidden" name="logo_url" value={logoUrl} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Títulos da proposta</CardTitle>
              <CardDescription>Texto exibido no cabeçalho de cada PDF gerado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="proposta_titulo">Título principal</Label>
                <Input
                  id="proposta_titulo"
                  name="proposta_titulo"
                  defaultValue={config?.proposta_titulo ?? 'PROPOSTA COMERCIAL'}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proposta_subtitulo">Subtítulo</Label>
                <Input
                  id="proposta_subtitulo"
                  name="proposta_subtitulo"
                  defaultValue={config?.proposta_subtitulo ?? 'Solução em Tecnologia Educacional'}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rodapé e condições gerais</CardTitle>
              <CardDescription>Texto exibido no rodapé de cada proposta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="rodape_condicoes">Condições gerais</Label>
                <Textarea
                  id="rodape_condicoes"
                  name="rodape_condicoes"
                  rows={3}
                  defaultValue={config?.rodape_condicoes ?? 'Proposta válida até a data indicada. Valores sujeitos a revisão após o prazo. Impostos não incluídos.'}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CSS customizado</CardTitle>
              <CardDescription>
                Estilos CSS adicionais aplicados ao PDF. Ex: <code className="text-xs bg-slate-100 px-1 rounded">{'body { font-family: Georgia; }'}</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="css_customizado">CSS</Label>
                <Textarea
                  id="css_customizado"
                  name="css_customizado"
                  rows={5}
                  className="font-mono text-sm"
                  placeholder={'/* Estilos adicionais para o PDF */\nbody { font-family: Georgia, serif; }\n.pdf-content { color: #1a1a2e; }'}
                  defaultValue={config?.css_customizado ?? ''}
                />
              </div>
            </CardContent>
          </Card>

        </div>
      </details>

      <div className="flex items-center justify-between">
        {propostaExemploId && !templatePdfUrl && (
          <a
            href={`/proposta/${propostaExemploId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
          >
            Ver PDF de exemplo →
          </a>
        )}
        <div className="flex items-center gap-3 ml-auto">
          {salvoOk && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="w-4 h-4" /> Salvo!
            </span>
          )}
          {salvoErro && (
            <span className="flex items-center gap-1 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" /> {salvoErro}
            </span>
          )}
          <Button type="submit" size="lg" disabled={salvando}>
            {salvando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar template
          </Button>
        </div>
      </div>
    </form>
  )
}
