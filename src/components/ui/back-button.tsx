'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function BackButton({ label = '← Voltar' }: { label?: string }) {
  const router = useRouter()
  return (
    <Button type="button" variant="outline" onClick={() => router.back()}>
      {label}
    </Button>
  )
}
