/**
 * Migration 009: PorEscolaXKit
 * Uso: node scripts/run-migration-009.mjs
 */

const SUPABASE_URL = 'https://qtdmtdetepebqcpzcsdx.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZG10ZGV0ZXBlYnFjcHpjc2R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg1NzcyMCwiZXhwIjoyMDg3NDMzNzIwfQ.CbwzscWYLiuJpFrzmGLIG6b_KXXsjMsNWnwKW1NNCug'
const PAT          = 'sb_publishable_2-3tZVtde-Gan5i195ReFA_e7Wqp8az'
const REF          = 'qtdmtdetepebqcpzcsdx'

function ok(msg)   { console.log(`  ✅ ${msg}`) }
function err(msg)  { console.error(`  ❌ ${msg}`) }
function info(msg) { console.log(`  ℹ️  ${msg}`) }

async function runSQL(sql, label) {
  // Tenta Management API com PAT
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PAT}`,
    },
    body: JSON.stringify({ query: sql }),
  })
  const body = await res.text()
  if (res.ok) { ok(label); return true }

  // Fallback: tenta com service_role key
  const res2 = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  })
  const body2 = await res2.text()
  if (res2.ok) { ok(label); return true }

  err(`${label} — PAT: ${body} | service_role: ${body2}`)
  return false
}

async function checkColumnExists() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/propostas?select=num_kits&limit=0`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  return res.ok
}

async function checkEnumValue() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/produto_componentes?select=tipo_calculo&tipo_calculo=eq.PorEscolaXKit&limit=1`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  // 200 significa que o enum existe (mesmo sem resultados), 400 significa que não existe
  return res.ok
}

;(async () => {
  console.log('\n🚀 Migration 009: PorEscolaXKit\n')

  // 1. ALTER TYPE
  const enumOk = await checkEnumValue()
  if (enumOk) {
    info('Enum PorEscolaXKit já existe — pulando ALTER TYPE')
  } else {
    await runSQL(
      `ALTER TYPE tipo_calculo ADD VALUE IF NOT EXISTS 'PorEscolaXKit';`,
      'ALTER TYPE tipo_calculo ADD VALUE PorEscolaXKit'
    )
  }

  // 2. ADD COLUMN num_kits
  const colOk = await checkColumnExists()
  if (colOk) {
    info('Coluna num_kits já existe — pulando ADD COLUMN')
  } else {
    await runSQL(
      `ALTER TABLE propostas ADD COLUMN IF NOT EXISTS num_kits INTEGER NOT NULL DEFAULT 5;`,
      'ADD COLUMN num_kits'
    )
  }

  // 3. UPDATE produto_componentes
  const res = await fetch(`${SUPABASE_URL}/rest/v1/produto_componentes?nome=eq.Kit+de+Hardware&tipo_calculo=eq.Fixo&select=id`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  const rows = await res.json()

  if (!Array.isArray(rows) || rows.length === 0) {
    info('Kit de Hardware com tipo_calculo=Fixo não encontrado (já atualizado ou não existe)')
  } else {
    const ids = rows.map(r => r.id)
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/produto_componentes?id=in.(${ids.join(',')})`, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ tipo_calculo: 'PorEscolaXKit' }),
    })
    if (updateRes.ok) {
      ok(`Kit de Hardware atualizado para PorEscolaXKit (${ids.length} registro(s))`)
    } else {
      err(`Falha ao atualizar Kit de Hardware: ${await updateRes.text()}`)
    }
  }

  console.log('\n✅ Migration 009 concluída!\n')
})()
