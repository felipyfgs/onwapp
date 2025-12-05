"use client"

import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { Settings, Trash2, Key, Copy, Check } from "lucide-react"
import { toast } from "sonner"

import { SessionHeader } from "@/components/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { api } from "@/lib/api"
import type { Session } from "@/types"

interface SettingsPageProps {
  params: Promise<{ id: string }>
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [session, setSession] = React.useState<Session | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [deleting, setDeleting] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await api.sessions.get(id)
        setSession(data)
      } catch (error) {
        console.error("Failed to fetch session:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [id])

  const handleCopyApiKey = () => {
    if (session?.apiKey) {
      navigator.clipboard.writeText(session.apiKey)
      setCopied(true)
      toast.success("API Key copiada!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.sessions.delete(id)
      toast.success("Sessao deletada com sucesso")
      router.push("/")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar sessao")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <>
        <SessionHeader sessionId={id} pageTitle="Configuracoes" />
        <div className="flex-1 p-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <SessionHeader sessionId={id} pageTitle="Configuracoes" />
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuracoes</h2>
          <p className="text-muted-foreground">
            Gerencie as configuracoes da sessao
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Key
            </CardTitle>
            <CardDescription>
              Use esta chave para autenticar requisicoes a API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                readOnly
                value={session?.apiKey || "Nao disponivel"}
                type="password"
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyApiKey}
                disabled={!session?.apiKey}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informacoes da Sessao
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>ID da Sessao</Label>
              <Input readOnly value={session?.id || ""} className="font-mono" />
            </div>
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input readOnly value={session?.session || ""} />
            </div>
            <div className="grid gap-2">
              <Label>Criado em</Label>
              <Input
                readOnly
                value={session?.createdAt ? new Date(session.createdAt).toLocaleString("pt-BR") : ""}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Acoes irreversiveis para esta sessao
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting ? "Deletando..." : "Deletar Sessao"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acao nao pode ser desfeita. Isso ira deletar permanentemente
                    a sessao &quot;{session?.session}&quot; e todos os dados associados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
