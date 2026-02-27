'use client'

import { useState } from 'react'
import { Input } from './input'

interface CurrencyInputProps {
  name: string
  required?: boolean
  className?: string
  placeholder?: string
}

export function CurrencyInput({ name, required, className, placeholder = 'R$ 0,00' }: CurrencyInputProps) {
  const [display, setDisplay] = useState('')
  const [raw, setRaw] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Mantém só dígitos
    const digits = e.target.value.replace(/\D/g, '')
    if (digits === '') {
      setDisplay('')
      setRaw('')
      return
    }

    // Interpreta como centavos: 150000000 → 1500000.00
    const cents = parseInt(digits, 10)
    const value = cents / 100

    // Formata para exibição: R$ 1.500.000,00
    const formatted = value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    })

    setDisplay(formatted)
    setRaw(value.toFixed(2))
  }

  return (
    <>
      <Input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={className}
      />
      <input type="hidden" name={name} value={raw} />
    </>
  )
}
