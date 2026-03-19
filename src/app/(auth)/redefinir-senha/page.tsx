'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, BookOpen, Eye, EyeOff } from 'lucide-react'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setErro('Erro ao redefinir senha. O link pode ter expirado. Solicite um novo.')
    } else {
      router.push('/dashboard')
      router.refresh()
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
            <CardTitle className="text-xl">Redefinir senha</CardTitle>
            <CardDescription>
              Digite sua nova senha abaixo.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senha">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(v => !v)}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmar">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirmar"
                    type={mostrarConfirmar ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmar(v => !v)}
                    aria-label={mostrarConfirmar ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {mostrarConfirmar ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {erro && (
                <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {erro}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar nova senha'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
