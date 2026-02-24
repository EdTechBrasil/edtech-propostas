import { redirect } from 'next/navigation'

export default async function Home({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  if (code) {
    redirect(`/auth/callback?code=${code}&next=/redefinir-senha`)
  }
  redirect('/dashboard')
}
