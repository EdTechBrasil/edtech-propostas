'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { salvarConfiguracaoPdf, uploadLogoPdf } from '@/lib/actions/admin'
import { Upload, Loader2, Check, AlertCircle } from 'lucide-react'
import Image from 'next/image'

type Config = {
  empresa_nome: string
  proposta_titulo: string
  proposta_subtitulo: string
  logo_url: string | null
  rodape_condicoes: string | null
  css_customizado: string | null
}

export function TemplatePdfCliente({ config, propostaExemploId }: { config: Config | null; propostaExemploId?: string }) {
  const [logoUrl, setLogoUrl] = useState(config?.logo_url ?? '')
  const [uploadando, setUploadando] = useState(false)
  const [uploadErro, setUploadErro] = useState('')
  const [salvando, startSalvar] = useTransition()
  const [salvoOk, setSalvoOk] = useState(false)
  const [salvoErro, setSalvoErro] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadando(true)
    setUploadErro('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadLogoPdf(fd)
    setUploadando(false)
    if (res && 'url' in res && res.url) {
      setLogoUrl(res.url)
    } else if (res && 'error' in res) {
      setUploadErro(res.error ?? 'Erro ao fazer upload')
    }
  }

  function handleSubmit(formData: FormData) {
    setSalvoOk(false)
    setSalvoErro('')
    formData.set('logo_url', logoUrl)
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

  return (
    <form action={handleSubmit} className="space-y-6">
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

          <div className="space-y-2">
            <Label>Logo da empresa</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative w-32 h-16 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-32 h-16 rounded-md border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                  Sem logo
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadando}
                  className="gap-2"
                >
                  {uploadando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadando ? 'Enviando…' : 'Enviar logo'}
                </Button>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 text-xs"
                    onClick={() => setLogoUrl('')}
                  >
                    Remover logo
                  </Button>
                )}
                {uploadErro && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {uploadErro}
                  </p>
                )}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <input type="hidden" name="logo_url" value={logoUrl} />
          </div>
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

      <div className="flex items-center justify-between">
        {propostaExemploId && (
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
