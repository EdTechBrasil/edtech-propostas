'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { criarUsuario, atualizarPerfilUsuario, toggleAtivoUsuario } from '@/lib/actions/admin'
import { UserPlus, Loader2 } from 'lucide-react'

type Usuario = {
  id: string
  email: string
  nome: string
  perfil: string
  ativo: boolean
}

export function UsuariosCliente({ usuarios }: { usuarios: Usuario[] }) {
  const [open, setOpen] = useState(false)
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCriar(formData: FormData) {
    setErro('')
    startTransition(async () => {
      const result = await criarUsuario(formData)
      if ('error' in result) {
        setErro(result.error ?? 'Erro inesperado')
      } else {
        setOpen(false)
      }
    })
  }

  function handleToggleAtivo(id: string, ativo: boolean) {
    startTransition(async () => { await toggleAtivoUsuario(id, !ativo) })
  }

  function handlePerfil(id: string, perfil: string) {
    startTransition(async () => { await atualizarPerfilUsuario(id, perfil) })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Usuários</h1>
          <p className="text-slate-500 mt-1">{usuarios.length} usuário(s) cadastrado(s)</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar novo usuário</DialogTitle>
              <DialogDescription>
                O usuário receberá acesso imediato com as credenciais informadas.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCriar} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input id="nome" name="nome" placeholder="Ex: Ana Silva" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" name="email" type="email" placeholder="ana@empresa.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha temporária *</Label>
                <Input id="senha" name="senha" type="password" placeholder="Mín. 6 caracteres" minLength={6} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perfil">Perfil de acesso *</Label>
                <select
                  name="perfil"
                  id="perfil"
                  defaultValue="Comercial"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="Comercial">Comercial</option>
                  <option value="Gestor">Gestor</option>
                  <option value="ADM">ADM</option>
                </select>
              </div>

              {erro && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">{erro}</p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Criar usuário
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Usuário</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Perfil</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Ativo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-slate-400 text-sm py-12">
                  Nenhum usuário cadastrado
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{u.nome || '—'}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      defaultValue={u.perfil}
                      onValueChange={(v) => handlePerfil(u.id, v)}
                    >
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Comercial">Comercial</SelectItem>
                        <SelectItem value="Gestor">Gestor</SelectItem>
                        <SelectItem value="ADM">ADM</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={u.ativo}
                      onCheckedChange={() => handleToggleAtivo(u.id, u.ativo)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
