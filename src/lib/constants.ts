// Shared constants — TAPETE MPC e navegação de propostas

export const TAPETE_TYPES = new Set(['TapetePreI', 'TapetePreII', 'TapeteAno1', 'TapeteAno2', 'TapeteAno3'])

export const TAPETE_KEYS: Record<string, string> = {
  TapetePreI: 'PreI', TapetePreII: 'PreII', TapeteAno1: 'Ano1', TapeteAno2: 'Ano2', TapeteAno3: 'Ano3',
}

export const TAPETE_MULT: Record<string, number> = {
  TapetePreI: 9, TapetePreII: 11, TapeteAno1: 16, TapeteAno2: 16, TapeteAno3: 16,
}

export function linkProposta(id: string, status: string): string {
  if (status === 'Aguardando_aprovacao' || status === 'Aprovada_excecao' || status === 'Pronta_pdf') {
    return `/proposta/${id}/revisao`
  }
  if (status === 'Em_revisao') {
    return `/proposta/${id}/cliente`
  }
  return `/proposta/${id}/publico`
}
