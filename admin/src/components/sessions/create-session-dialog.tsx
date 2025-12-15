"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Plus } from "lucide-react"
import { useSessions } from "@/hooks/use-api" // Using useSessions hook which exposes createSession
import { toast } from "sonner"

const formSchema = z.object({
  session: z.string().min(3, "O nome da sessão deve ter pelo menos 3 caracteres"),
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
      // The API expects { session: "name" } based on typical REST patterns or potentially just the body
      // Based on previous code analysis, createSession takes just `data`. 
      // Let's assume the API payload should be { session: "name" } directly or similar.
      // However, looking at the previous code: `createSession(sessionName.trim())` suggesting it was sending a string?
      // Wait, api-client.ts says: `createSession: (data: any) => apiRequest<Session>("/sessions", "POST", data),`
      // So if we pass `{ session: "name" }`, it sends that JSON.

      await createSession(values)
      toast.success("Sessão criada com sucesso!")
      form.reset()
      setOpen?.(false)
      onSessionCreated?.()
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar sessão")
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
                    <Input placeholder="Digite o nome da sessão" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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