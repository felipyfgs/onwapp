import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function Home() {
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.has('api_key')

  if (isAuthenticated) {
    redirect('/sessions')
  } else {
    redirect('/login')
  }
}
