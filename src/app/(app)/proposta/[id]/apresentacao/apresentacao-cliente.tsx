'use client'

import { useState, useTransition, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { salvarApresentacao, uploadLogoProposta } from '@/lib/actions/proposta'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2, FileText, ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Upload, AlertCircle, Bold, Italic, Underline as UnderlineIcon } from 'lucide-react'
import Link from 'next/link'
import { DocumentoApresentacao } from './documento-apresentacao'

function toHtml(text: string): string {
  if (!text.trim()) return ''
  if (text.trimStart().startsWith('<')) return text
  return text.split('\n\n').filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('')
}

type Solucao = { titulo: string; descricao: string }
type CronogramaItem = { etapa: string; duracao: string }

type InitialData = {
  titulo: string
  introducao: string
  objetivos: string[]
  solucoes: Solucao[]
  cronograma: CronogramaItem[]
  termos: string
}

type InvestimentoItemDetalhe = {
  nome: string
  categoria: string
  quantidade: number
  valorUnit: number
  total: number
  tipo: 'componente' | 'servico'
}

type InvestimentoProduto = {
  nome: string
  itens: InvestimentoItemDetalhe[]
  totalProduto: number
}

// ── Modelos de conteúdo EdTech ─────────────────────────────────────────────────

const MODELO_OBJETIVOS = [
  'Modernizar a infraestrutura tecnológica pedagógica',
  'Aumentar o engajamento e desempenho dos alunos',
  'Oferecer ferramentas de gestão para coordenadores e professores',
  'Integrar conteúdo digital ao currículo existente',
  'Capacitar educadores para uso das novas tecnologias',
]

const MODELO_SOLUCOES: Solucao[] = [
  {
    titulo: 'A – Aprender',
    descricao: 'Reúne soluções didáticas, projetos educacionais e instrumentos pedagógicos voltados à efetivação do currículo e ao desenvolvimento das competências e habilidades dos estudantes. Compõem esse eixo propostas como o Sistema de Ensino e os projetos com foco em sustentabilidade, fortalecendo a coerência pedagógica da rede e ampliando as oportunidades de aprendizagem em sintonia com as demandas contemporâneas da educação pública.',
  },
  {
    titulo: 'G – Gestão',
    descricao: 'Compreende a estrutura de acompanhamento da execução educacional por meio de uma plataforma orientada ao ciclo PDCA, permitindo ao Município monitorar metas, planos de ação, indicadores, prazos e evidências de execução. Contribui para dar maior disciplina à rotina gerencial da rede, favorecendo o alinhamento entre planejamento, execução, verificação e correção de rota.',
  },
  {
    titulo: 'I – Inteligência',
    descricao: 'Traduz o compromisso da solução com o uso qualificado das informações da rede municipal. Por meio da integração e análise de dados relevantes, esse eixo permite identificar prioridades, fragilidades, riscos e oportunidades de melhoria, apoiando decisões mais assertivas por parte dos gestores.',
  },
  {
    titulo: 'R – Resultados',
    descricao: 'Consolida aprendizagem, gestão e inteligência em melhoria educacional mensurável e sustentável. A formação continuada de professores, gestores e equipes técnicas assume papel fundamental, assegurando a apropriação da metodologia, o uso qualificado dos recursos disponibilizados e a execução consistente das ações planejadas.',
  },
]

const MODELO_CRONOGRAMA: CronogramaItem[] = [
  { etapa: 'Implantação e configuração', duracao: '2 semanas' },
  { etapa: 'Capacitação da equipe', duracao: '1 semana' },
  { etapa: 'Período piloto com turmas', duracao: '4 semanas' },
  { etapa: 'Expansão para todas as turmas', duracao: '2 semanas' },
  { etapa: 'Acompanhamento e suporte', duracao: 'Contínuo' },
]

const MODELO_TERMOS = 'Esta proposta tem validade de 30 dias. Os valores apresentados referem-se ao período de vigência do contrato. O pagamento poderá ser parcelado conforme negociação. A implantação inicia após assinatura do contrato e comprovante de pagamento da entrada.'

// ──────────────────────────────────────────────────────────────────────────────

export function ApresentacaoCliente({
  propostaId,
  clienteNome,
  dataEmissao,
  empresaNome,
  empresaSubtitulo,
  logoUrl,
  investimentoProdutos,
  totalLiquido,
  initialData,
}: {
  propostaId: string
  clienteNome: string
  dataEmissao: string
  empresaNome: string
  empresaSubtitulo: string
  logoUrl: string | null
  investimentoProdutos: InvestimentoProduto[]
  totalLiquido: number
  initialData: InitialData
}) {
  const [titulo, setTitulo] = useState(initialData.titulo)
  const [introducao, setIntroducao] = useState(toHtml(initialData.introducao))
  const introEditor = useEditor({
    extensions: [StarterKit, Underline],
    content: toHtml(initialData.introducao),
    onUpdate: ({ editor }) => setIntroducao(editor.getHTML()),
    immediatelyRender: false,
  })
  const [objetivos, setObjetivos] = useState<string[]>(initialData.objetivos.length > 0 ? initialData.objetivos : [''])
  const [solucoes, setSolucoes] = useState<Solucao[]>(initialData.solucoes.length > 0 ? initialData.solucoes : [{ titulo: '', descricao: '' }])
  const [cronograma, setCronograma] = useState<CronogramaItem[]>(initialData.cronograma.length > 0 ? initialData.cronograma : [{ etapa: '', duracao: '' }])
  const [termos, setTermos] = useState(initialData.termos)
  const [logoAtual, setLogoAtual] = useState<string | null>(logoUrl)
  const [uploadandoLogo, setUploadandoLogo] = useState(false)
  const [erroLogo, setErroLogo] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const logoFileRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadandoLogo(true)
    setErroLogo('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadLogoProposta(propostaId, fd)
    setUploadandoLogo(false)
    if (res && 'url' in res && res.url) {
      setLogoAtual(res.url)
    } else if (res && 'error' in res) {
      setErroLogo(res.error ?? 'Erro ao enviar logo')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('titulo', titulo)
    fd.set('introducao', introducao)
    fd.set('objetivos', JSON.stringify(objetivos.filter(o => o.trim())))
    fd.set('solucoes', JSON.stringify(solucoes.filter(s => s.titulo.trim())))
    fd.set('cronograma', JSON.stringify(cronograma.filter(c => c.etapa.trim())))
    fd.set('termos', termos)
    fd.set('logo_url', logoAtual ?? '')
    startTransition(() => salvarApresentacao(propostaId, fd))
  }

  const clienteDisplay = clienteNome || 'Cliente'
  const modeloIntroducao = `A presente proposta comercial tem por objeto a disponibilização, ao Município de [NOME DO MUNICÍPIO]/[UF], por meio da [NOME DA SECRETARIA], do Ecossistema AGIR360, concebido como uma solução integrada voltada à melhoria da aprendizagem, ao fortalecimento da gestão educacional e à qualificação da tomada de decisão na rede municipal de ensino. Trata-se de uma proposta estruturada para apoiar o município na organização de sua política educacional a partir de uma lógica sistêmica, em que currículo, prática pedagógica, gestão, análise de dados e acompanhamento institucional atuam de forma articulada e complementar.\n\nAssim, o que se propõe ao Município de [NOME DO MUNICÍPIO] não é a aquisição de elementos isolados, mas a implementação de uma solução integrada de caráter metodológico, técnico e educacional, estruturada para promover coerência entre ensino, gestão, acompanhamento e resultado. O Ecossistema AGIR360 organiza a atuação da rede municipal em torno de um modelo contínuo de melhoria, no qual as ações pedagógicas e gerenciais passam a compor uma estratégia única, orientada por evidências e voltada à aprendizagem do aluno como finalidade central.`

  function preencherExemplo() {
    setTitulo('Ecossistema AGIR360')
    const htmlIntro = toHtml(`A presente proposta comercial tem por objeto a disponibilização, ao Município de [NOME DO MUNICÍPIO]/[UF], por meio da [NOME DA SECRETARIA], do Ecossistema AGIR360, concebido como uma solução integrada voltada à melhoria da aprendizagem, ao fortalecimento da gestão educacional e à qualificação da tomada de decisão na rede municipal de ensino. Trata-se de uma proposta estruturada para apoiar o município na organização de sua política educacional a partir de uma lógica sistêmica, em que currículo, prática pedagógica, gestão, análise de dados e acompanhamento institucional atuam de forma articulada e complementar.\n\nAssim, o que se propõe ao Município de [NOME DO MUNICÍPIO] não é a aquisição de elementos isolados, mas a implementação de uma solução integrada de caráter metodológico, técnico e educacional, estruturada para promover coerência entre ensino, gestão, acompanhamento e resultado. O Ecossistema AGIR360 organiza a atuação da rede municipal em torno de um modelo contínuo de melhoria, no qual as ações pedagógicas e gerenciais passam a compor uma estratégia única, orientada por evidências e voltada à aprendizagem do aluno como finalidade central.`)
    setIntroducao(htmlIntro)
    introEditor?.commands.setContent(htmlIntro)
    setObjetivos([
      'Melhorar os indicadores de aprendizagem da rede municipal de ensino',
      'Fortalecer a gestão educacional com base em evidências e ciclo PDCA',
      'Qualificar a tomada de decisão por meio de análise de dados integrada',
      'Promover formação continuada de professores, gestores e equipes técnicas',
      'Implementar solução sistêmica articulando currículo, gestão e resultados',
    ])
    setSolucoes([
      {
        titulo: 'A – Aprender',
        descricao: 'Reúne soluções didáticas, projetos educacionais e instrumentos pedagógicos voltados à efetivação do currículo e ao desenvolvimento das competências e habilidades dos estudantes. Compõem esse eixo propostas como o Sistema de Ensino e os projetos com foco em sustentabilidade, fortalecendo a coerência pedagógica da rede e ampliando as oportunidades de aprendizagem em sintonia com as demandas contemporâneas da educação pública.',
      },
      {
        titulo: 'G – Gestão',
        descricao: 'Compreende a estrutura de acompanhamento da execução educacional por meio de uma plataforma orientada ao ciclo PDCA, permitindo ao Município monitorar metas, planos de ação, indicadores, prazos e evidências de execução. Contribui para dar maior disciplina à rotina gerencial da rede, favorecendo o alinhamento entre planejamento, execução, verificação e correção de rota.',
      },
      {
        titulo: 'I – Inteligência',
        descricao: 'Traduz o compromisso da solução com o uso qualificado das informações da rede municipal. Por meio da integração e análise de dados relevantes, esse eixo permite identificar prioridades, fragilidades, riscos e oportunidades de melhoria, apoiando decisões mais assertivas por parte dos gestores.',
      },
      {
        titulo: 'R – Resultados',
        descricao: 'Consolida aprendizagem, gestão e inteligência em melhoria educacional mensurável e sustentável. A formação continuada de professores, gestores e equipes técnicas assume papel fundamental, assegurando a apropriação da metodologia, o uso qualificado dos recursos disponibilizados e a execução consistente das ações planejadas.',
      },
    ])
    setCronograma([
      { etapa: 'Reunião de kickoff e levantamento', duracao: '1 semana' },
      { etapa: 'Implantação e configuração da plataforma', duracao: '2 semanas' },
      { etapa: 'Capacitação da equipe pedagógica', duracao: '1 semana' },
      { etapa: 'Projeto piloto com turmas selecionadas', duracao: '4 semanas' },
      { etapa: 'Expansão para toda a instituição', duracao: '2 semanas' },
      { etapa: 'Acompanhamento e suporte contínuo', duracao: 'Contínuo' },
    ])
    setTermos('Esta proposta tem validade de 30 dias a partir da data de emissão. Os valores apresentados referem-se ao período de 12 meses de licença. O pagamento poderá ser parcelado em até 12x. A implantação será iniciada após assinatura do contrato e confirmação do pagamento da primeira parcela. Inclui suporte técnico e atualizações da plataforma durante toda a vigência.')
  }

  function preencherGenerico() {
    setTitulo('Solução EdTech para ' + clienteDisplay)
    const htmlIntro = toHtml(`É com grande satisfação que apresentamos a ${clienteDisplay} esta proposta de parceria educacional. Nossa solução foi desenvolvida para transformar o ambiente de aprendizagem, integrando tecnologia de ponta ao cotidiano escolar. Acreditamos que a inovação pedagógica é o caminho para preparar alunos para os desafios do século XXI, e estamos prontos para apoiar sua instituição nessa jornada.`)
    setIntroducao(htmlIntro)
    introEditor?.commands.setContent(htmlIntro)
    setObjetivos([
      'Modernizar a infraestrutura tecnológica pedagógica da instituição',
      'Aumentar o engajamento e o desempenho acadêmico dos alunos',
      'Oferecer ferramentas de gestão para coordenadores e professores',
      'Integrar conteúdo digital interativo ao currículo existente',
      'Capacitar educadores para uso pleno das novas tecnologias',
    ])
    setSolucoes([
      { titulo: 'Plataforma Digital de Aprendizagem', descricao: 'Ambiente virtual completo com conteúdos interativos, videoaulas, avaliações adaptativas e trilhas de aprendizado personalizadas para cada aluno, acessível em qualquer dispositivo.' },
      { titulo: 'Capacitação Continuada de Professores', descricao: 'Programa estruturado de formação docente com workshops presenciais e online, certificação e suporte pedagógico permanente durante toda a vigência do contrato.' },
      { titulo: 'Painel de Gestão e Relatórios', descricao: 'Dashboard completo com indicadores de desempenho por turma, relatórios de engajamento, alertas de risco de evasão e dados para tomada de decisão pelos gestores.' },
      { titulo: 'Suporte Técnico e Implantação', descricao: 'Equipe dedicada para instalação, configuração e acompanhamento durante todo o período, garantindo funcionamento pleno e resolução ágil de qualquer necessidade técnica.' },
    ])
    setCronograma([
      { etapa: 'Reunião de kickoff e levantamento', duracao: '1 semana' },
      { etapa: 'Implantação e configuração da plataforma', duracao: '2 semanas' },
      { etapa: 'Capacitação da equipe pedagógica', duracao: '1 semana' },
      { etapa: 'Projeto piloto com turmas selecionadas', duracao: '4 semanas' },
      { etapa: 'Expansão para toda a instituição', duracao: '2 semanas' },
      { etapa: 'Acompanhamento e suporte contínuo', duracao: 'Contínuo' },
    ])
    setTermos('Esta proposta tem validade de 30 dias a partir da data de emissão. Os valores apresentados referem-se ao período de 12 meses de licença. O pagamento poderá ser parcelado em até 12x. A implantação será iniciada após assinatura do contrato e confirmação do pagamento da primeira parcela. Inclui suporte técnico e atualizações da plataforma durante toda a vigência.')
  }

  return (
    <div className="flex gap-0 h-[calc(100vh-120px)] -mx-4 md:-mx-8 -mt-4 md:-mt-8 overflow-hidden">

      {/* ── Painel esquerdo: editor ───────────────────────────────────── */}
      <div
        className={`flex-shrink-0 border-r border-slate-200 dark:border-slate-700 overflow-y-auto bg-white dark:bg-slate-900 transition-all duration-200 ${collapsed ? 'w-0 overflow-hidden' : 'w-[420px]'}`}
      >
        <div className="p-5 min-w-[420px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Apresentação</h1>
              <p className="text-xs text-slate-400 mt-0.5">Monte o documento comercial da proposta</p>
            </div>
            <Link href={`/proposta/${propostaId}/cliente`}>
              <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-slate-500">
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar
              </Button>
            </Link>
          </div>
          <div className="mb-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={preencherGenerico}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium py-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Modelo genérico
            </button>
            <button
              type="button"
              onClick={preencherExemplo}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-medium py-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Modelo AGIR360
            </button>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">

            {/* Logo da proposta */}
            <Section title="Logo da Proposta">
              <div className="flex items-center gap-3">
                {logoAtual ? (
                  <div className="w-32 h-12 rounded border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoAtual} alt="Logo" className="max-w-full max-h-full object-contain"
                      onError={() => setErroLogo('URL inválida. Reenvie a imagem.')} />
                  </div>
                ) : (
                  <div className="w-32 h-12 rounded border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                    Sem logo
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => logoFileRef.current?.click()}
                    disabled={uploadandoLogo}
                    className="flex items-center gap-1.5 text-xs font-medium text-teal-700 border border-teal-300 rounded-md px-3 py-1.5 hover:bg-teal-50 transition-colors disabled:opacity-50"
                  >
                    {uploadandoLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploadandoLogo ? 'Enviando…' : logoAtual ? 'Trocar' : 'Enviar logo'}
                  </button>
                  {logoAtual && (
                    <button type="button" onClick={() => setLogoAtual(null)}
                      className="text-xs text-slate-400 hover:text-red-500 text-left">
                      Remover
                    </button>
                  )}
                  {erroLogo && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{erroLogo}
                    </p>
                  )}
                </div>
              </div>
              <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </Section>

            {/* Informações básicas */}
            <Section title="Informações Básicas">
              <div className="space-y-1.5">
                <Label className="text-xs">Título do projeto</Label>
                <Input
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex: Transformação Digital Educacional"
                />
              </div>
            </Section>

            {/* Introdução */}
            <Section
              title="Introdução"
              onUseModel={() => {
                const html = toHtml(modeloIntroducao)
                setIntroducao(html)
                introEditor?.commands.setContent(html)
              }}
            >
              <div className="rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 text-sm overflow-hidden">
                <div className="flex items-center gap-0.5 border-b border-input px-2 py-1 bg-slate-50">
                  <button type="button" onClick={() => introEditor?.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${introEditor?.isActive('bold') ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
                    title="Negrito">
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => introEditor?.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${introEditor?.isActive('italic') ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
                    title="Itálico">
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => introEditor?.chain().focus().toggleUnderline().run()}
                    className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${introEditor?.isActive('underline') ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
                    title="Sublinhado">
                    <UnderlineIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
                <EditorContent
                  editor={introEditor}
                  className="px-3 py-2 min-h-[96px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_p:last-child]:mb-0"
                />
              </div>
            </Section>

            {/* Objetivos */}
            <Section
              title="Objetivos"
              onAdd={() => setObjetivos(prev => [...prev, ''])}
              onUseModel={() => setObjetivos(MODELO_OBJETIVOS)}
            >
              <div className="space-y-2">
                {objetivos.map((obj, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={obj}
                      onChange={e => setObjetivos(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                      placeholder={`Objetivo ${i + 1}`}
                    />
                    {objetivos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setObjetivos(prev => prev.filter((_, j) => j !== i))}
                        className="p-2 text-slate-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* Soluções */}
            <Section
              title="Soluções"
              onAdd={() => setSolucoes(prev => [...prev, { titulo: '', descricao: '' }])}
              onUseModel={() => setSolucoes(MODELO_SOLUCOES)}
            >
              <div className="space-y-3">
                {solucoes.map((sol, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={sol.titulo}
                        onChange={e => setSolucoes(prev => prev.map((s, j) => j === i ? { ...s, titulo: e.target.value } : s))}
                        placeholder="Título da solução"
                        className="font-medium"
                      />
                      {solucoes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSolucoes(prev => prev.filter((_, j) => j !== i))}
                          className="p-2 text-slate-400 hover:text-red-500 rounded flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={sol.descricao}
                      onChange={e => setSolucoes(prev => prev.map((s, j) => j === i ? { ...s, descricao: e.target.value } : s))}
                      placeholder="Descrição breve..."
                      rows={2}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>
                ))}
              </div>
            </Section>

            {/* Cronograma */}
            <Section
              title="Cronograma"
              onAdd={() => setCronograma(prev => [...prev, { etapa: '', duracao: '' }])}
              onUseModel={() => setCronograma(MODELO_CRONOGRAMA)}
            >
              <div className="space-y-2">
                {cronograma.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={item.etapa}
                      onChange={e => setCronograma(prev => prev.map((c, j) => j === i ? { ...c, etapa: e.target.value } : c))}
                      placeholder="Etapa"
                      className="flex-1"
                    />
                    <Input
                      value={item.duracao}
                      onChange={e => setCronograma(prev => prev.map((c, j) => j === i ? { ...c, duracao: e.target.value } : c))}
                      placeholder="Duração"
                      className="w-28"
                    />
                    <button
                      type="button"
                      onClick={() => setCronograma(prev => prev.filter((_, j) => j !== i))}
                      className="p-2 text-slate-400 hover:text-red-500 rounded flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Section>

            {/* Termos */}
            <Section title="Termos e Condições" onUseModel={() => setTermos(MODELO_TERMOS)}>
              <textarea
                value={termos}
                onChange={e => setTermos(e.target.value)}
                placeholder="Ex: Esta proposta tem validade de 15 dias. O pagamento pode ser parcelado em até 10x..."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </Section>

            <Button type="submit" disabled={isPending} className="w-full gap-2">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {isPending ? 'Salvando...' : 'Salvar e gerar PDF'}
            </Button>

          </form>
        </div>
      </div>

      {/* ── Painel direito: preview ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-800 p-6 relative">
        {/* Botão colapso */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute left-2 top-2 z-10 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-teal-600 transition-colors"
          title={collapsed ? 'Abrir editor' : 'Fechar editor'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className="max-w-[794px] mx-auto shadow-xl rounded-lg overflow-hidden">
          <DocumentoApresentacao
            empresaNome={empresaNome}
            empresaSubtitulo={empresaSubtitulo}
            logoUrl={logoAtual}
            dataEmissao={dataEmissao}
            titulo={titulo}
            clienteNome={clienteNome}
            introducao={introducao}
            objetivos={objetivos}
            solucoes={solucoes}
            cronograma={cronograma}
            termos={termos}
            investimentoProdutos={investimentoProdutos}
            totalLiquido={totalLiquido}
          />
        </div>
      </div>
    </div>
  )
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────

function Section({
  title,
  onAdd,
  onUseModel,
  children,
}: {
  title: string
  onAdd?: () => void
  onUseModel?: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-teal-600">{title}</h3>
          {onUseModel && (
            <button
              type="button"
              onClick={onUseModel}
              className="text-[11px] text-slate-400 hover:text-teal-600 underline-offset-2 hover:underline transition-colors"
            >
              usar modelo
            </button>
          )}
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
