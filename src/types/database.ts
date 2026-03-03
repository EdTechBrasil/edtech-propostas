export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Enums ────────────────────────────────────────────────────────────────────

export type PerfilUsuario = 'Comercial' | 'Gestor' | 'ADM'

export type StatusProposta =
  | 'Rascunho'
  | 'Em_revisao'
  | 'Aguardando_aprovacao'
  | 'Aprovada_excecao'
  | 'Pronta_pdf'
  | 'Cancelada'

export type TipoRepasse = 'Nenhum' | 'Fixo' | 'Percentual'

export type CategoriaComponente =
  | 'LicencaAluno'
  | 'LicencaProfessor'
  | 'Kit'
  | 'Livro'
  | 'Tema'
  | 'Pagina'
  | 'Credito'
  | 'ItemFixo'
  | 'Plataforma'

export type TipoCalculo =
  | 'Fixo'
  | 'PorAluno'
  | 'PorProfessor'
  | 'PorEscola'
  | 'PorSerie'
  | 'PorAlunoXTema'
  | 'PorProfessorXTema'

export type TipoEventoProposta =
  | 'Criacao'
  | 'MudancaOrcamento'
  | 'AddProduto'
  | 'RemoverProduto'
  | 'AlterarComponente'
  | 'AlterarServico'
  | 'AlterarDesconto'
  | 'AlterarRepasse'
  | 'AtualizarCliente'
  | 'SolicitarAprovacao'
  | 'AprovarExcecao'
  | 'GerarPDF'

// ─── Tabelas ──────────────────────────────────────────────────────────────────

export interface Usuario {
  id: string
  nome: string
  perfil: PerfilUsuario
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface ConfiguracaoFinanceira {
  id: string
  ativo: boolean
  margem_minima_percent: number
  margem_global_max_percent: number
  desconto_max_percent: number
  criado_por_usuario_id: string
  criado_em: string
}

export interface Produto {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface ProdutoComponente {
  id: string
  produto_id: string
  nome: string
  categoria: CategoriaComponente
  tipo_calculo: TipoCalculo
  obrigatorio: boolean
  valor_venda_base: number
  custo_interno_base: number
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface ProdutoServico {
  id: string
  produto_id: string
  nome: string
  tipo_calculo: TipoCalculo
  obrigatorio: boolean
  valor_venda_base: number
  custo_interno_base: number
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface Proposta {
  id: string
  criado_por_usuario_id: string
  status: StatusProposta
  orcamento_alvo: number
  limite_orcamento_max: number | null
  desconto_global_percent: number
  repasse_tipo: TipoRepasse
  repasse_valor: number
  publico_descricao: string | null
  num_escolas: number
  num_alunos: number
  num_professores: number
  cliente_nome_instituicao: string | null
  cliente_cnpj: string | null
  cliente_responsavel: string | null
  cliente_email: string | null
  cliente_cidade: string | null
  validade_proposta: string | null
  pdf_path: string | null
  criado_em: string
  atualizado_em: string
}

export interface PropostaProduto {
  id: string
  proposta_id: string
  produto_id: string
  desconto_percent: number
  criado_em: string
}

export interface PropostaComponente {
  id: string
  proposta_id: string
  proposta_produto_id: string
  produto_componente_id: string
  quantidade: number
  valor_venda_unit: number
  custo_interno_unit: number
  desconto_percent: number
  obrigatorio: boolean
  criado_em: string
}

export interface PropostaServico {
  id: string
  proposta_id: string
  proposta_produto_id: string
  produto_servico_id: string
  quantidade: number
  valor_venda_unit: number
  custo_interno_unit: number
  desconto_percent: number
  obrigatorio: boolean
  criado_em: string
}

export interface AprovacaoExcecaoMargem {
  id: string
  proposta_id: string
  solicitado_por_usuario_id: string
  aprovado_por_usuario_id: string | null
  margem_minima_percent: number
  margem_calculada_percent: number
  motivo: string | null
  aprovado: boolean | null
  criado_em: string
}

export interface PropostaHistorico {
  id: string
  proposta_id: string
  usuario_id: string
  tipo_evento: TipoEventoProposta
  detalhes: string | null
  criado_em: string
}

// ─── View de Cálculo Financeiro ───────────────────────────────────────────────

export interface PropostaFinanceiro {
  proposta_id: string
  receita_bruta: number
  total_descontos: number
  receita_liquida: number
  custo_produtos: number
  custo_servicos: number
  repasse_valor_calculado: number
  custo_total: number
  lucro_bruto: number
  margem_percent: number
}

// ─── Database (para tipagem do Supabase client) ───────────────────────────────

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: Usuario
        Insert: Omit<Usuario, 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<Usuario, 'id' | 'criado_em'>>
      }
      configuracao_financeira: {
        Row: ConfiguracaoFinanceira
        Insert: Omit<ConfiguracaoFinanceira, 'id' | 'criado_em'>
        Update: Partial<Omit<ConfiguracaoFinanceira, 'id' | 'criado_em'>>
      }
      produtos: {
        Row: Produto
        Insert: Omit<Produto, 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<Produto, 'id' | 'criado_em'>>
      }
      produto_componentes: {
        Row: ProdutoComponente
        Insert: Omit<ProdutoComponente, 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<ProdutoComponente, 'id' | 'criado_em'>>
      }
      produto_servicos: {
        Row: ProdutoServico
        Insert: Omit<ProdutoServico, 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<ProdutoServico, 'id' | 'criado_em'>>
      }
      propostas: {
        Row: Proposta
        Insert: Omit<Proposta, 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<Proposta, 'id' | 'criado_em'>>
      }
      proposta_produtos: {
        Row: PropostaProduto
        Insert: Omit<PropostaProduto, 'id' | 'criado_em'>
        Update: Partial<Omit<PropostaProduto, 'id' | 'criado_em'>>
      }
      proposta_componentes: {
        Row: PropostaComponente
        Insert: Omit<PropostaComponente, 'id' | 'criado_em'>
        Update: Partial<Omit<PropostaComponente, 'id' | 'criado_em'>>
      }
      proposta_servicos: {
        Row: PropostaServico
        Insert: Omit<PropostaServico, 'id' | 'criado_em'>
        Update: Partial<Omit<PropostaServico, 'id' | 'criado_em'>>
      }
      aprovacao_excecao_margem: {
        Row: AprovacaoExcecaoMargem
        Insert: Omit<AprovacaoExcecaoMargem, 'id' | 'criado_em'>
        Update: Partial<Omit<AprovacaoExcecaoMargem, 'id' | 'criado_em'>>
      }
      proposta_historico: {
        Row: PropostaHistorico
        Insert: Omit<PropostaHistorico, 'id' | 'criado_em'>
        Update: never
      }
    }
    Views: {
      proposta_financeiro: {
        Row: PropostaFinanceiro
      }
    }
    Enums: {
      perfil_usuario: PerfilUsuario
      status_proposta: StatusProposta
      tipo_repasse: TipoRepasse
      categoria_componente: CategoriaComponente
      tipo_calculo: TipoCalculo
      tipo_evento_proposta: TipoEventoProposta
    }
  }
}
