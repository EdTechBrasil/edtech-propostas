import { redirect } from 'next/navigation'

export default function Home({ searchParams }: { searchParams: { code?: string } }) {
  if (searchParams.code) {
    redirect(`/auth/callback?code=${searchParams.code}&next=/redefinir-senha`)
  }
  redirect('/dashboard')
}
