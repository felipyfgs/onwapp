"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { AlertCircle } from "lucide-react"
import { Plus } from "lucide-react"
import { useSessions } from "@/hooks/use-api"
import { toast } from "sonner"
import { SessionCreateData } from "@/types/session"

const formSchema = z.object({
  session: z.string()
    .min(3, "O nome da sessão deve ter pelo menos 3 caracteres")
    .max(50, "O nome da sessão deve ter no máximo 50 caracteres")
    .regex(/^[a-zA-Z0-9_-]+$/, "Apenas letras, números, hífens e sublinhados são permitidos")
    .refine((val) => !val.includes(' '), "O nome não pode conter espaços"),
})

interface CreateSessionDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSessionCreated?: () => void
  trigger?: React.ReactNode
}

export const CreateSessionDialog = ({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSessionCreated,
  trigger
}: CreateSessionDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Use controlled state if provided, otherwise internal state
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen : setInternalOpen

  const { createSession } = useSessions()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      session: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      const sessionData: SessionCreateData = {
        session: values.session.trim()
      };
      await createSession(sessionData)
      toast.success("Sessão criada com sucesso!")
      form.reset()
      setOpen?.(false)
      onSessionCreated?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar sessão";
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset()
    }
    setOpen?.(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && !isControlled && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Sessão
          </Button>
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Sessão</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="session"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Sessão</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ex: minha-sessao-whatsapp" 
                      {...field} 
                      disabled={loading}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use apenas letras, números, hífens (-) e sublinhados (_). Sem espaços.
                  </p>
                </FormItem>
              )}
            />

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Dica para o nome da sessão:</p>
                  <ul className="space-y-1">
                    <li>• Use nomes descritivos: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">vendas-maio</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">suporte-cliente</code></li>
                    <li>• Evite caracteres especiais e espaços</li>
                    <li>• O nome será usado para identificar a sessão em toda a aplicação</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Criando..." : "Criar Sessão"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}