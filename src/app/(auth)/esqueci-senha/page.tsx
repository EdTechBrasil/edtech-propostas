'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, BookOpen, ArrowLeft } from 'lucide-react'

export default function EsqueciSenhaPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    })

    if (error) {
      setErro('Erro ao enviar e-mail. Verifique o endereço e tente novamente.')
    } else {
      setEnviado(true)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">EdTech Propostas</h1>
          <p className="text-sm text-muted-foreground">Sistema interno de inteligência comercial</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recuperar senha</CardTitle>
            <CardDescription>
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {enviado ? (
              <div className="space-y-4">
                <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  E-mail enviado! Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                </div>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="email"
                  />
                </div>

                {erro && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                    {erro}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar link de recuperação'
                  )}
                </Button>

                <Link href="/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao login
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
