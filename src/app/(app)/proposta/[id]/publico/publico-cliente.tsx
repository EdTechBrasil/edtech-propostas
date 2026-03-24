'use client'

import { useState } from 'react'
import { atualizarPublico } from '@/lib/actions/proposta'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BackButton } from '@/components/ui/back-button'
import { formatCurrency } from '@/utils/format'

const MPC_SERIES = [
  { key: 'pre_i',  label: 'Pré I',     mult: 9,  maxTemas: 3 },
  { key: 'pre_ii', label: 'Pré II',    mult: 12, maxTemas: 3 },
  { key: 'ano1',   label: '1ª série',  mult: 16, maxTemas: 4 },
  { key: 'ano2',   label: '2ª série',  mult: 16, maxTemas: 4 },
  { key: 'ano3',   label: '3ª série',  mult: 16, maxTemas: 4 },
]

const CRIACODE_SERIES = [
  { key: 'ano1', label: '1º Ano', maxTemas: 4 },
  { key: 'ano2', label: '2º Ano', maxTemas: 4 },
  { key: 'ano3', label: '3º Ano', maxTemas: 4 },
  { key: 'ano4', label: '4º Ano', maxTemas: 4 },
  { key: 'ano5', label: '5º Ano', maxTemas: 4 },
]

const CODING_SERIES_FULL = [
  { key: 'ano3', label: '3º ano', maxTemas: 10 },
  { key: 'ano4', label: '4º ano', maxTemas: 10 },
  { key: 'ano5', label: '5º ano', maxTemas: 10 },
  { key: 'ano6', label: '6º ano', maxTemas: 10 },
  { key: 'ano7', label: '7º ano', maxTemas: 10 },
  { key: 'ano8', label: '8º ano', maxTemas: 10 },
  { key: 'ano9', label: '9º ano', maxTemas: 10 },
]

// When MPC is also present, ano3 is already in the MPC section
const CODING_SERIES_WITH_MPC = CODING_SERIES_FULL.filter(s => s.key !== 'ano3')

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
  num_alunos_ano4: number
  num_alunos_ano5: number
  num_alunos_ano6: number
  num_alunos_ano7: number
  num_alunos_ano8: number
  num_alunos_ano9: number
  num_temas_ano4: number
  num_temas_ano5: number
  num_temas_ano6: number
  num_temas_ano7: number
  num_temas_ano8: number
  num_temas_ano9: number
  num_livros_conceitos: number
  num_livros_praticas: number
  num_livros_guia: number
}

function alunosField(p: Proposta, key: string): number {
  const map: Record<string, number> = {
    pre_i: p.num_alunos_pre_i, pre_ii: p.num_alunos_pre_ii,
    ano1:  p.num_alunos_ano1,  ano2:   p.num_alunos_ano2,  ano3: p.num_alunos_ano3,
    ano4:  p.num_alunos_ano4,  ano5:   p.num_alunos_ano5,  ano6: p.num_alunos_ano6,
    ano7:  p.num_alunos_ano7,  ano8:   p.num_alunos_ano8,  ano9: p.num_alunos_ano9,
  }
  return map[key] ?? 0
}

function temasField(p: Proposta, key: string): number {
  const map: Record<string, number> = {
    pre_i: p.num_temas_pre_i, pre_ii: p.num_temas_pre_ii,
    ano1:  p.num_temas_ano1,  ano2:   p.num_temas_ano2,  ano3: p.num_temas_ano3,
    ano4:  p.num_temas_ano4,  ano5:   p.num_temas_ano5,  ano6: p.num_temas_ano6,
    ano7:  p.num_temas_ano7,  ano8:   p.num_temas_ano8,  ano9: p.num_temas_ano9,
  }
  return map[key] ?? 0
}

// Unified series for state initialisation (all possible series)
const ALL_SERIES = [...MPC_SERIES, ...CODING_SERIES_FULL.filter(s => s.key !== 'ano3')]

export function PublicoCliente({
  proposta,
  temMPC,
  temCoding,
  temEdtechIA,
  temCriaCode,
  servicosFormacao,
}: {
  proposta: Proposta
  temMPC: boolean
  temCoding: boolean
  temEdtechIA: boolean
  temCriaCode: boolean
  servicosFormacao: { presencial: ServicoFormacao | null; ead: ServicoFormacao | null; assessoria: ServicoFormacao | null }
}) {
  const action = atualizarPublico.bind(null, proposta.id)

  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ALL_SERIES.map(s => [s.key, alunosField(proposta, s.key) > 0]))
  )

  const [alunos, setAlunos] = useState<Record<string, string>>(() =>
    Object.fromEntries(ALL_SERIES.map(s => [s.key, String(alunosField(proposta, s.key) || '')]))
  )

  const [temas, setTemas] = useState<Record<string, string>>(() =>
    Object.fromEntries(ALL_SERIES.map(s => [s.key, String(temasField(proposta, s.key) || '')]))
  )

  const [numProf, setNumProf] = useState(proposta.num_professores || 0)

  function toggleSerie(key: string, on: boolean) {
    setChecked(prev => ({ ...prev, [key]: on }))
    if (!on) {
      setAlunos(prev => ({ ...prev, [key]: '' }))
      setTemas(prev => ({ ...prev, [key]: '' }))
    }
  }

  const anyMpcChecked      = MPC_SERIES.some(s => checked[s.key])
  const codingSeries       = temMPC ? CODING_SERIES_WITH_MPC : CODING_SERIES_FULL
  const anyCodingChecked   = codingSeries.some(s => checked[s.key])
  const criaCodeSeries     = CRIACODE_SERIES.filter(s => !temMPC || !['ano1','ano2','ano3'].includes(s.key))
    .filter(s => !temCoding || !['ano3','ano4','ano5'].includes(s.key))
  const anyCriaCodeChecked = CRIACODE_SERIES.some(s => checked[s.key])

  const [livrosConceitos, setLivrosConceitos] = useState(proposta.num_livros_conceitos || 1)
  const [livrosPraticas,  setLivrosPraticas]  = useState(proposta.num_livros_praticas  || 0)

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
  const hasSeriesMode = temMPC || temCoding || temCriaCode
  const hasAnySpecialMode = hasSeriesMode || temEdtechIA

  // Validação: quando há produto com séries, ao menos uma série deve ter alunos preenchidos
  const algumaSerieSalva = Object.values(checked).some(v => v) &&
    Object.entries(checked).some(([k, v]) => v && Number(alunos[k] || 0) > 0)
  const seriesObrigatorias = hasSeriesMode && !algumaSerieSalva

  // Validação: séries com alunos preenchidos mas temas = 0 (bloqueia submit)
  const temasMpcFaltando = temMPC
    ? MPC_SERIES.filter(s =>
        checked[s.key] && Number(alunos[s.key] || 0) > 0 && Number(temas[s.key] || 0) === 0
      )
    : []
  const temasCodingFaltando = temCoding
    ? codingSeries.filter(s =>
        checked[s.key] && Number(alunos[s.key] || 0) > 0 && Number(temas[s.key] || 0) === 0
      )
    : []
  const temasFaltando = temasMpcFaltando.length > 0 || temasCodingFaltando.length > 0
  const seriesFaltandoNomes = [
    ...temasMpcFaltando.map(s => s.label),
    ...temasCodingFaltando.map(s => s.label),
  ].join(', ')

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
        <input type="hidden" name="has_mpc"        value={temMPC       ? 'true' : 'false'} />
        <input type="hidden" name="has_coding"     value={temCoding    ? 'true' : 'false'} />
        <input type="hidden" name="has_edtech_ia"  value={temEdtechIA  ? 'true' : 'false'} />
        <input type="hidden" name="has_criacode"   value={temCriaCode  ? 'true' : 'false'} />

        {hasAnySpecialMode ? (
          <>
            {/* Hidden zeros para séries quando não há MPC nem Coding */}
            {!hasSeriesMode && ALL_SERIES.map(s => (
              <span key={s.key}>
                <input type="hidden" name={`alunos_${s.key}`} value="0" />
                <input type="hidden" name={`temas_${s.key}`}  value="0" />
              </span>
            ))}
            {!temMPC && <input type="hidden" name="livros_guia" value="1" />}

            {/* Escolas + Professores (shared) */}
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
                      onChange={e => setNumProf(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MPC Section */}
            {temMPC && (
              <Card>
                <CardHeader>
                  <CardTitle>Séries — Meu Primeiro Código</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Hidden inputs for unchecked MPC series */}
                  {MPC_SERIES.map(s => (
                    !checked[s.key] && (
                      <span key={s.key}>
                        <input type="hidden" name={`alunos_${s.key}`} value="0" />
                        <input type="hidden" name={`temas_${s.key}`}  value="0" />
                      </span>
                    )
                  ))}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">Séries &amp; Alunos</p>
                      {anyMpcChecked && (
                        <span className="text-sm text-slate-500">
                          Total:{' '}
                          <span className="font-semibold text-slate-700">
                            {MPC_SERIES.reduce((sum, s) => sum + (Number(alunos[s.key]) || 0), 0)} alunos
                          </span>
                        </span>
                      )}
                    </div>
                    {MPC_SERIES.map(s => (
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
                        {checked[s.key] && (
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
                        )}
                      </div>
                    ))}
                  </div>

                  {anyMpcChecked && (
                    <>
                      <hr className="border-slate-100" />
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Temas por série</p>
                        {MPC_SERIES.filter(s => checked[s.key]).map(s => (
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
                              max={s.maxTemas}
                              placeholder="0"
                              className="w-20 h-8"
                              value={temas[s.key]}
                              onChange={e => {
                                const val = Math.min(Number(e.target.value), s.maxTemas)
                                setTemas(prev => ({ ...prev, [s.key]: val > 0 ? String(val) : e.target.value }))
                              }}
                            />
                            <span className="text-xs text-slate-400">máx {s.maxTemas}</span>
                          </div>
                        ))}
                      </div>
                      <input type="hidden" name="livros_guia" value="1" />
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Coding Section */}
            {temCoding && (
              <Card>
                <CardHeader>
                  <CardTitle>Séries — Coding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Hidden inputs for unchecked Coding series */}
                  {codingSeries.map(s => (
                    !checked[s.key] && (
                      <span key={s.key}>
                        <input type="hidden" name={`alunos_${s.key}`} value="0" />
                        <input type="hidden" name={`temas_${s.key}`}  value="0" />
                      </span>
                    )
                  ))}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">Séries &amp; Alunos</p>
                      {anyCodingChecked && (
                        <span className="text-sm text-slate-500">
                          Total:{' '}
                          <span className="font-semibold text-slate-700">
                            {codingSeries.reduce((sum, s) => sum + (Number(alunos[s.key]) || 0), 0)} alunos
                          </span>
                        </span>
                      )}
                    </div>
                    {codingSeries.map(s => (
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
                        {checked[s.key] && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`alunos_${s.key}_c`} className="text-sm text-slate-500 whitespace-nowrap">
                              Alunos:
                            </Label>
                            <Input
                              id={`alunos_${s.key}_c`}
                              name={`alunos_${s.key}`}
                              type="number"
                              min="0"
                              placeholder="0"
                              className="w-24 h-8"
                              value={alunos[s.key]}
                              onChange={e => setAlunos(prev => ({ ...prev, [s.key]: e.target.value }))}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {anyCodingChecked && (
                    <>
                      <hr className="border-slate-100" />
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Temas por série</p>
                        {codingSeries.filter(s => checked[s.key]).map(s => (
                          <div key={s.key} className="flex items-center gap-3">
                            <span className="text-sm text-slate-600 w-28">{s.label}:</span>
                            <Label htmlFor={`temas_${s.key}_c`} className="text-sm text-slate-500 whitespace-nowrap">
                              Temas:
                            </Label>
                            <Input
                              id={`temas_${s.key}_c`}
                              name={`temas_${s.key}`}
                              type="number"
                              min="0"
                              max={s.maxTemas}
                              placeholder="0"
                              className="w-20 h-8"
                              value={temas[s.key]}
                              onChange={e => {
                                const val = Math.min(Number(e.target.value), s.maxTemas)
                                setTemas(prev => ({ ...prev, [s.key]: val > 0 ? String(val) : e.target.value }))
                              }}
                            />
                            <span className="text-xs text-slate-400">máx {s.maxTemas}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cria+Code Section */}
            {temCriaCode && (
              <Card>
                <CardHeader>
                  <CardTitle>Séries Atendidas (1º ao 5º Ano)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Cria+Code não usa temas — zerar todos */}
                  {CRIACODE_SERIES.map(s => (
                    <input key={s.key} type="hidden" name={`temas_${s.key}`} value="0" />
                  ))}
                  {/* Hidden inputs for unchecked Cria+Code series */}
                  {criaCodeSeries.map(s => (
                    !checked[s.key] && (
                      <input key={s.key} type="hidden" name={`alunos_${s.key}`} value="0" />
                    )
                  ))}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">Séries &amp; Alunos</p>
                      {anyCriaCodeChecked && (
                        <span className="text-sm text-slate-500">
                          Total:{' '}
                          <span className="font-semibold text-slate-700">
                            {CRIACODE_SERIES.reduce((sum, s) => sum + (Number(alunos[s.key]) || 0), 0)} alunos
                          </span>
                        </span>
                      )}
                    </div>
                    {criaCodeSeries.map(s => (
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
                        {checked[s.key] && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`alunos_${s.key}_cc`} className="text-sm text-slate-500 whitespace-nowrap">
                              Alunos:
                            </Label>
                            <Input
                              id={`alunos_${s.key}_cc`}
                              name={`alunos_${s.key}`}
                              type="number"
                              min="0"
                              placeholder="0"
                              className="w-24 h-8"
                              value={alunos[s.key]}
                              onChange={e => setAlunos(prev => ({ ...prev, [s.key]: e.target.value }))}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                </CardContent>
              </Card>
            )}

            {/* Edtech IA Section */}
            {temEdtechIA && (
              <Card>
                <CardHeader>
                  <CardTitle>Edtech IA — Público</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Alunos */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="alunos_ia">Alunos</Label>
                      <Input
                        id="alunos_ia"
                        name="alunos"
                        type="number"
                        min="0"
                        placeholder="0"
                        defaultValue={proposta.num_alunos || ''}
                      />
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Livros */}
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-3">Livros do Projeto</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="livros_conceitos">Livros de Conceitos <span className="text-slate-400 font-normal">(obrigatório, 1–4)</span></Label>
                        <Input
                          id="livros_conceitos"
                          name="livros_conceitos"
                          type="number"
                          min="1"
                          max="4"
                          className="w-24"
                          value={livrosConceitos}
                          onChange={e => setLivrosConceitos(Math.min(4, Math.max(1, Number(e.target.value) || 1)))}
                        />
                        <p className="text-xs text-slate-500">64 págs × R$ 2,50 = <strong>R$ 160,00</strong>/livro por pessoa</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="livros_praticas">Livros de Práticas Digitais <span className="text-slate-400 font-normal">(opcional, 0–2)</span></Label>
                        <Input
                          id="livros_praticas"
                          name="livros_praticas"
                          type="number"
                          min="0"
                          max="2"
                          className="w-24"
                          value={livrosPraticas}
                          onChange={e => setLivrosPraticas(Math.min(2, Math.max(0, Number(e.target.value) || 0)))}
                        />
                        <p className="text-xs text-slate-500">96 págs × R$ 2,50 = <strong>R$ 240,00</strong>/livro por pessoa</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                          placeholder="Ex: 26 (opcional)"
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
                          placeholder="Ex: 20 (opcional)"
                          defaultValue={servicosFormacao.assessoria.quantidade > 1 ? servicosFormacao.assessoria.quantidade : ''}
                        />
                        {servicosFormacao.assessoria.valor_venda_unit > 0 && (
                          <p className="text-xs text-slate-500">{formatCurrency(servicosFormacao.assessoria.valor_venda_unit)} por hora</p>
                        )}
                      </div>
                    )}
                  </div>
                  {temMPC && servicosFormacao.presencial && (
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
          /* Simple form (no MPC, no Coding, no Edtech IA) */
          <>
            {/* Hidden inputs: zero all per-serie and livros fields */}
            {ALL_SERIES.map(s => (
              <span key={s.key}>
                <input type="hidden" name={`alunos_${s.key}`} value="0" />
                <input type="hidden" name={`temas_${s.key}`}  value="0" />
              </span>
            ))}
            <input type="hidden" name="livros_conceitos" value="0" />
            <input type="hidden" name="livros_praticas"  value="0" />
            <input type="hidden" name="livros_guia"      value="1" />

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
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {seriesObrigatorias && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            Selecione ao menos uma série e informe o número de alunos para continuar.
          </div>
        )}
        {temasFaltando && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <span className="font-medium">Temas obrigatórios não preenchidos:</span>{' '}
            {seriesFaltandoNomes}. Informe o número de temas para cada série antes de continuar.
          </div>
        )}
        <div className="flex justify-between">
          <BackButton />
          <Button type="submit" disabled={seriesObrigatorias || temasFaltando}>Continuar →</Button>
        </div>
      </form>
    </div>
  )
}
