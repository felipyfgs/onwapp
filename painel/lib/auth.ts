'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const VALID_API_KEY = process.env.GLOBAL_API_KEY || '745FBF5F8D2F662AC2F398854194E'

export async function login(prevState: unknown, formData: FormData) {
  const apiKey = formData.get('apiKey') as string

  if (apiKey === VALID_API_KEY) {
    const cookieStore = await cookies()
    cookieStore.set('api_key', apiKey, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    redirect('/sessions')
  }

  return { error: 'API Key invalida' }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('api_key')
  redirect('/login')
}
