export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2).replace('.', ',')}%`
}

export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  )
}

export function margemColor(margem: number): string {
  if (margem >= 20) return 'text-green-600'
  if (margem >= 12) return 'text-yellow-600'
  return 'text-red-600'
}

export function margemBgColor(margem: number): string {
  if (margem >= 20) return 'bg-green-100 text-green-700'
  if (margem >= 12) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}
