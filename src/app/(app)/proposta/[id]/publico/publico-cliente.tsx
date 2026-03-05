'use client'

import { useState } from 'react'
import { atualizarPublico } from '@/lib/actions/proposta'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BackButton } from '@/components/ui/back-button'
import { formatCurrency } from '@/utils/format'

const SERIES = [
  { key: 'pre_i',  label: 'Pré I',     mult: 9 },
  { key: 'pre_ii', label: 'Pré II',    mult: 12 },
  { key: 'ano1',   label: '1ª série',  mult: 16 },
  { key: 'ano2',   label: '2ª série',  mult: 16 },
  { key: 'ano3',   label: '3ª série',  mult: 16 },
]

interface ServicoFormacao {
  id: string
  quantidade: number
  valor_venda_unit: number
}

interface Proposta {
  id: string
  orcamento_alvo: number
  limite_orcamento_max: number
  num_escolas: number
  num_professores: number
  num_alunos: number
  num_temas: number
  num_alunos_pre_i: number
  num_alunos_pre_ii: number
  num_alunos_ano1: number
  num_alunos_ano2: number
  num_alunos_ano3: number
  num_temas_pre_i: number
  num_temas_pre_ii: number
  num_temas_ano1: number
  num_temas_ano2: number
  num_temas_ano3: number
}

function alunosField(p: Proposta, key: string): number {
  const map: Record<string, number> = {
    pre_i: p.num_alunos_pre_i, pre_ii: p.num_alunos_pre_ii,
    ano1:  p.num_alunos_ano1,  ano2:   p.num_alunos_ano2,  ano3: p.num_alunos_ano3,
  }
  return map[key] ?? 0
}

function temasField(p: Proposta, key: string): number {
  const map: Record<string, number> = {
    pre_i: p.num_temas_pre_i, pre_ii: p.num_temas_pre_ii,
    ano1:  p.num_temas_ano1,  ano2:   p.num_temas_ano2,  ano3: p.num_temas_ano3,
  }
  return map[key] ?? 0
}

export function PublicoCliente({
  proposta,
  temMPC,
  servicosFormacao,
}: {
  proposta: Proposta
  temMPC: boolean
  servicosFormacao: { presencial: ServicoFormacao | null; ead: ServicoFormacao | null; assessoria: ServicoFormacao | null }
}) {
  const action = atualizarPublico.bind(null, proposta.id)

  // checked: series that have alunos filled (only relevant for MPC mode)
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SERIES.map(s => [s.key, alunosField(proposta, s.key) > 0]))
  )

  // alunos input values per serie (as strings for controlled inputs)
  const [alunos, setAlunos] = useState<Record<string, string>>(() =>
    Object.fromEntries(SERIES.map(s => [s.key, String(alunosField(proposta, s.key) || '')]))
  )

  // temas input values per serie
  const [temas, setTemas] = useState<Record<string, string>>(() =>
    Object.fromEntries(SERIES.map(s => [s.key, String(temasField(proposta, s.key) || '')]))
  )

  // professores value for dynamic suggestion in formação card
  const [numProf, setNumProf] = useState(proposta.num_professores || 0)

  function toggleSerie(key: string, on: boolean) {
    setChecked(prev => ({ ...prev, [key]: on }))
    if (!on) {
      setAlunos(prev => ({ ...prev, [key]: '' }))
      setTemas(prev => ({ ...prev, [key]: '' }))
    }
  }

  const anyChecked = SERIES.some(s => checked[s.key])

  const orcamentoInfo = proposta.orcamento_alvo > 0 ? (
    <>
      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
        <span className="text-slate-500">Orçamento alvo: </span>
        <span className="font-semibold">{formatCurrency(proposta.orcamento_alvo)}</span>
      </div>
      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
        <span className="text-slate-500">Limite máximo: </span>
        <span className="font-semibold">{formatCurrency(proposta.limite_orcamento_max ?? 0)}</span>
      </div>
    </>
  ) : (
    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 font-medium">
      Orçamento não definido
    </div>
  )

  const turmas = numProf > 0 ? Math.ceil(numProf / 50) : 0
  const temFormacao = servicosFormacao.presencial || servicosFormacao.ead || servicosFormacao.assessoria

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Público</h1>
        <p className="text-slate-500 mt-1">Defina o público-alvo desta proposta</p>
      </div>

      <div className="mb-4 flex gap-4">
        {orcamentoInfo}
      </div>

      <form action={action} className="space-y-6">
        <input type="hidden" name="has_mpc" value={temMPC ? 'true' : 'false'} />

        {temMPC ? (
          <>
            {/* Hidden inputs: always submit all 10 per-serie fields */}
            {SERIES.map(s => (
              <span key={s.key}>
                {!checked[s.key] && (
                  <>
                    <input type="hidden" name={`alunos_${s.key}`} value="0" />
                    <input type="hidden" name={`temas_${s.key}`} value="0" />
                  </>
                )}
              </span>
            ))}

            <Card>
              <CardHeader>
                <CardTitle>Estrutura do público</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Escolas + Professores */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="escolas">Escolas</Label>
                    <Input
                      id="escolas"
                      name="escolas"
                      type="number"
                      min="0"
                      placeholder="0"
                      defaultValue={proposta.num_escolas || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="professores">Professores</Label>
                    <Input
                      id="professores"
                      name="professores"
                      type="number"
                      min="0"
                      placeholder="0"
                      defaultValue={proposta.num_professores || ''}
                      onChange={e => setNumProf(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Séries & Alunos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Séries &amp; Alunos</p>
                    {anyChecked && (
                      <span className="text-sm text-slate-500">
                        Total:{' '}
                        <span className="font-semibold text-slate-700">
                          {SERIES.reduce((sum, s) => sum + (Number(alunos[s.key]) || 0), 0)} alunos
                        </span>
                      </span>
                    )}
                  </div>
                  {SERIES.map(s => (
                    <div key={s.key} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 w-28 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked[s.key] ?? false}
                          onChange={e => toggleSerie(s.key, e.target.checked)}
                          className="w-4 h-4 rounded accent-slate-700"
                        />
                        <span className="text-sm text-slate-700">{s.label}</span>
                      </label>
                      {checked[s.key] ? (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`alunos_${s.key}`} className="text-sm text-slate-500 whitespace-nowrap">
                            Alunos:
                          </Label>
                          <Input
                            id={`alunos_${s.key}`}
                            name={`alunos_${s.key}`}
                            type="number"
                            min="0"
                            placeholder="0"
                            className="w-24 h-8"
                            value={alunos[s.key]}
                            onChange={e => setAlunos(prev => ({ ...prev, [s.key]: e.target.value }))}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Temas por série (only when at least 1 serie checked) */}
                {anyChecked && (
                  <>
                    <hr className="border-slate-100" />
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-700">Temas por série</p>
                      {SERIES.filter(s => checked[s.key]).map(s => (
                        <div key={s.key} className="flex items-center gap-3">
                          <span className="text-sm text-slate-600 w-28">{s.label}:</span>
                          <Label htmlFor={`temas_${s.key}`} className="text-sm text-slate-500 whitespace-nowrap">
                            Temas:
                          </Label>
                          <Input
                            id={`temas_${s.key}`}
                            name={`temas_${s.key}`}
                            type="number"
                            min="0"
                            max="4"
                            placeholder="0"
                            className="w-20 h-8"
                            value={temas[s.key]}
                            onChange={e => setTemas(prev => ({ ...prev, [s.key]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Formação e Assessoria */}
            {temFormacao && (
              <Card>
                <CardHeader>
                  <CardTitle>Formação e Assessoria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Informe a quantidade de horas necessárias (todos os campos são opcionais):
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {servicosFormacao.presencial && (
                      <div className="space-y-2">
                        <input type="hidden" name="formacao_presencial_id" value={servicosFormacao.presencial.id} />
                        <Label htmlFor="horas_formacao_presencial">Horas de Formação Presencial</Label>
                        <Input
                          id="horas_formacao_presencial"
                          name="horas_formacao_presencial"
                          type="number"
                          min="0"
                          placeholder="Ex: 20 (opcional)"
                          defaultValue={servicosFormacao.presencial.quantidade > 1 ? servicosFormacao.presencial.quantidade : ''}
                        />
                        {servicosFormacao.presencial.valor_venda_unit > 0 && (
                          <p className="text-xs text-slate-500">{formatCurrency(servicosFormacao.presencial.valor_venda_unit)} por hora</p>
                        )}
                      </div>
                    )}
                    {servicosFormacao.ead && (
                      <div className="space-y-2">
                        <input type="hidden" name="formacao_ead_id" value={servicosFormacao.ead.id} />
                        <Label htmlFor="horas_formacao_ead">Horas de Formação EAD</Label>
                        <Input
                          id="horas_formacao_ead"
                          name="horas_formacao_ead"
                          type="number"
                          min="0"
                          placeholder="Ex: 20 (opcional)"
                          defaultValue={servicosFormacao.ead.quantidade > 1 ? servicosFormacao.ead.quantidade : ''}
                        />
                        {servicosFormacao.ead.valor_venda_unit > 0 && (
                          <p className="text-xs text-slate-500">{formatCurrency(servicosFormacao.ead.valor_venda_unit)} por hora</p>
                        )}
                      </div>
                    )}
                    {servicosFormacao.assessoria && (
                      <div className="space-y-2">
                        <input type="hidden" name="formacao_assessoria_id" value={servicosFormacao.assessoria.id} />
                        <Label htmlFor="horas_formacao_assessoria">Horas de Assessoria</Label>
                        <Input
                          id="horas_formacao_assessoria"
                          name="horas_formacao_assessoria"
                          type="number"
                          min="0"
                          placeholder="Ex: 30 (opcional)"
                          defaultValue={servicosFormacao.assessoria.quantidade > 1 ? servicosFormacao.assessoria.quantidade : ''}
                        />
                        {servicosFormacao.assessoria.valor_venda_unit > 0 && (
                          <p className="text-xs text-slate-500">{formatCurrency(servicosFormacao.assessoria.valor_venda_unit)} por hora</p>
                        )}
                      </div>
                    )}
                  </div>
                  {servicosFormacao.presencial && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
                      <p className="font-medium">Por padrão, 8 horas para cada grupo de 50 professores.</p>
                      {turmas > 0 && (
                        <p className="mt-1">
                          Com {numProf} professor{numProf !== 1 ? 'es' : ''} → {turmas} turma{turmas !== 1 ? 's' : ''} = {turmas * 8} horas sugeridas.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Hidden inputs: zero all 10 per-serie fields */}
            {SERIES.map(s => (
              <span key={s.key}>
                <input type="hidden" name={`alunos_${s.key}`} value="0" />
                <input type="hidden" name={`temas_${s.key}`} value="0" />
              </span>
            ))}

            <Card>
              <CardHeader>
                <CardTitle>Estrutura do público</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="escolas">Escolas</Label>
                    <Input
                      id="escolas"
                      name="escolas"
                      type="number"
                      min="0"
                      placeholder="0"
                      defaultValue={proposta.num_escolas || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="professores">Professores</Label>
                    <Input
                      id="professores"
                      name="professores"
                      type="number"
                      min="0"
                      placeholder="0"
                      defaultValue={proposta.num_professores || ''}
                    />
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="alunos">Alunos</Label>
                    <Input
                      id="alunos"
                      name="alunos"
                      type="number"
                      min="0"
                      placeholder="0"
                      defaultValue={proposta.num_alunos || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temas">Temas</Label>
                    <Input
                      id="temas"
                      name="temas"
                      type="number"
                      min="0"
                      placeholder="0"
                      defaultValue={proposta.num_temas || ''}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex justify-between">
          <BackButton />
          <Button type="submit">Continuar →</Button>
        </div>
      </form>
    </div>
  )
}
