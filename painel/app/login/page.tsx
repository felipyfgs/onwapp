"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 60 // seconds
const MIN_KEY_LENGTH = 16

export default function LoginPage() {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)
  const { login } = useAuth()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // Check lockout on mount
  useEffect(() => {
    const storedLockout = sessionStorage.getItem("login_lockout")
    const storedAttempts = sessionStorage.getItem("login_attempts")
    
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout, 10)
      if (lockoutTime > Date.now()) {
        setLockoutUntil(lockoutTime)
      } else {
        sessionStorage.removeItem("login_lockout")
        sessionStorage.removeItem("login_attempts")
      }
    }
    
    if (storedAttempts) {
      setAttempts(parseInt(storedAttempts, 10))
    }
  }, [])

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockoutUntil) return

    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockoutUntil(null)
        setLockoutRemaining(0)
        setAttempts(0)
        sessionStorage.removeItem("login_lockout")
        sessionStorage.removeItem("login_attempts")
      } else {
        setLockoutRemaining(remaining)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lockoutUntil])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check lockout
    if (lockoutUntil && lockoutUntil > Date.now()) {
      toast.error(`Aguarde ${lockoutRemaining}s antes de tentar novamente`)
      return
    }

    const trimmedKey = apiKey.trim()
    
    if (!trimmedKey) {
      toast.error("API Key é obrigatória")
      return
    }

    if (trimmedKey.length < MIN_KEY_LENGTH) {
      toast.error(`API Key deve ter no mínimo ${MIN_KEY_LENGTH} caracteres`)
      return
    }

    setIsLoading(true)

    try {
      const success = await login(trimmedKey)
      
      if (success) {
        // Clear attempts on success
        sessionStorage.removeItem("login_attempts")
        sessionStorage.removeItem("login_lockout")
        setApiKey("") // Clear from memory
        toast.success("Conectado com sucesso!")
        router.push("/sessions")
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        sessionStorage.setItem("login_attempts", newAttempts.toString())
        
        if (newAttempts >= MAX_ATTEMPTS) {
          const lockout = Date.now() + (LOCKOUT_TIME * 1000)
          setLockoutUntil(lockout)
          setLockoutRemaining(LOCKOUT_TIME)
          sessionStorage.setItem("login_lockout", lockout.toString())
          toast.error(`Muitas tentativas. Aguarde ${LOCKOUT_TIME}s`)
        } else {
          toast.error(`API Key inválida (${MAX_ATTEMPTS - newAttempts} tentativas restantes)`)
        }
      }
    } catch {
      toast.error("Erro ao conectar. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const isLocked = lockoutUntil !== null && lockoutUntil > Date.now()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">OnWApp</CardTitle>
          <CardDescription>
            Digite sua API Key para acessar o painel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isLocked && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>Bloqueado por {lockoutRemaining}s devido a muitas tentativas</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="Sua chave de API"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoading || isLocked}
                  autoComplete="current-password"
                  className="pr-10"
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  disabled={isLocked}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {attempts > 0 && attempts < MAX_ATTEMPTS && !isLocked && (
                <p className="text-xs text-muted-foreground">
                  {MAX_ATTEMPTS - attempts} tentativas restantes
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || isLocked}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : isLocked ? (
                `Aguarde ${lockoutRemaining}s`
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
