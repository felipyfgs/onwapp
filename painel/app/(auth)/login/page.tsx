'use client'

import { useActionState } from 'react'
import { login } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="w-full max-w-sm space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="text-muted-foreground text-sm">
          Digite sua API Key para acessar o painel
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="password"
            name="apiKey"
            placeholder="API Key"
            required
          />
        </div>

        {state?.error && (
          <p className="text-sm text-destructive text-center">{state.error}</p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
