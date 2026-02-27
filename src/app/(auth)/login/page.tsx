'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Loader2, BookOpen, Eye, EyeOff } from 'lucide-react'

const MAX_TENTATIVAS = 5
const BLOQUEIO_MS = 5 * 60 * 1000 // 5 minutos

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [tentativas, setTentativas] = useState(0)
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(null)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const estaBloqueado = bloqueadoAte !== null && Date.now() < bloqueadoAte

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (estaBloqueado) {
      const restante = Math.ceil((bloqueadoAte! - Date.now()) / 1000 / 60)
      setErro(`Conta bloqueada temporariamente. Tente novamente em ${restante} minuto(s).`)
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      const novasTentativas = tentativas + 1
      setTentativas(novasTentativas)

      if (novasTentativas >= MAX_TENTATIVAS) {
        setBloqueadoAte(Date.now() + BLOQUEIO_MS)
        setErro('Muitas tentativas inválidas. Acesso bloqueado por 5 minutos.')
      } else {
        setErro('Usuário ou senha inválidos.')
      }
    } else {
      router.push('/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / marca */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">EdTech Propostas</h1>
          <p className="text-sm text-muted-foreground">Sistema interno de inteligência comercial</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Entrar</CardTitle>
            <CardDescription>Acesse com seu e-mail e senha</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || estaBloqueado}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    disabled={loading || estaBloqueado}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {erro && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {erro}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || estaBloqueado}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-1">
          <Link href="/esqueci-senha" className="text-sm text-primary hover:underline">
            Esqueci minha senha
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            Outros problemas de acesso? Fale com o administrador.
          </p>
        </div>
      </div>
    </div>
  )
}
