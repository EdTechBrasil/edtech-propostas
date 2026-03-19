'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const MAX_ATTEMPTS = 5
const BLOQUEIO_MS = 5 * 60 * 1000 // 5 min
const COOKIE_NAME = 'lr' // login_rate — nome curto para não revelar propósito

type RateData = { count: number; blockedUntil: number | null }

async function getRateData(): Promise<RateData> {
  const store = await cookies()
  const raw = store.get(COOKIE_NAME)?.value
  if (!raw) return { count: 0, blockedUntil: null }
  try {
    return JSON.parse(Buffer.from(raw, 'base64url').toString()) as RateData
  } catch {
    return { count: 0, blockedUntil: null }
  }
}

async function setRateData(data: RateData) {
  const store = await cookies()
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url')
  store.set(COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // expira em 1h no pior caso
  })
}

async function clearRateData() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function loginAction(
  email: string,
  senha: string
): Promise<{ success: true } | { error: string; bloqueadoAte?: number }> {
  const rate = await getRateData()

  // Verifica bloqueio ativo
  if (rate.blockedUntil && Date.now() < rate.blockedUntil) {
    const restante = Math.ceil((rate.blockedUntil - Date.now()) / 1000 / 60)
    return {
      error: `Conta bloqueada. Tente novamente em ${restante} minuto(s).`,
      bloqueadoAte: rate.blockedUntil,
    }
  }

  // Reset se o bloqueio expirou
  if (rate.blockedUntil && Date.now() >= rate.blockedUntil) {
    rate.count = 0
    rate.blockedUntil = null
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

  if (error) {
    const count = rate.count + 1
    if (count >= MAX_ATTEMPTS) {
      const blockedUntil = Date.now() + BLOQUEIO_MS
      await setRateData({ count, blockedUntil })
      return {
        error: 'Muitas tentativas inválidas. Acesso bloqueado por 5 minutos.',
        bloqueadoAte: blockedUntil,
      }
    }
    await setRateData({ count, blockedUntil: null })
    return { error: 'Usuário ou senha inválidos.' }
  }

  await clearRateData()
  return { success: true }
}
