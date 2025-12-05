"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Smartphone, Key } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { validateApiKey } from "@/lib/actions"

export default function LoginPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!apiKey.trim()) {
      toast.error("API Key e obrigatoria")
      return
    }

    setLoading(true)
    try {
      // Set cookie first so server action can use it
      document.cookie = `apiKey=${apiKey.trim()}; path=/; max-age=${60 * 60 * 24 * 30}`
      
      const isValid = await validateApiKey(apiKey.trim())

      if (isValid) {
        localStorage.setItem('apiKey', apiKey.trim())
        toast.success("Login realizado com sucesso!")
        router.push("/")
        router.refresh()
      } else {
        document.cookie = 'apiKey=; path=/; max-age=0'
        toast.error("API Key invalida")
      }
    } catch {
      document.cookie = 'apiKey=; path=/; max-age=0'
      toast.error("Erro ao conectar com a API")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">OnWapp</CardTitle>
          <CardDescription>
            Entre com sua API Key para acessar o painel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Sua API Key"
                  className="pl-9"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
