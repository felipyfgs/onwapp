"use client"

import * as React from "react"
import { use } from "react"
import { ScrollText, RefreshCw, Download } from "lucide-react"

import { SessionHeader } from "@/components/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LogsPageProps {
  params: Promise<{ id: string }>
}

interface LogEntry {
  id: string
  timestamp: string
  level: "info" | "warn" | "error"
  message: string
}

const mockLogs: LogEntry[] = [
  { id: "1", timestamp: "2025-12-05T10:30:00Z", level: "info", message: "Sessao conectada com sucesso" },
  { id: "2", timestamp: "2025-12-05T10:29:55Z", level: "info", message: "QR Code escaneado" },
  { id: "3", timestamp: "2025-12-05T10:29:30Z", level: "info", message: "Aguardando QR Code..." },
  { id: "4", timestamp: "2025-12-05T10:29:00Z", level: "info", message: "Iniciando conexao..." },
  { id: "5", timestamp: "2025-12-05T10:28:00Z", level: "warn", message: "Reconectando apos timeout" },
  { id: "6", timestamp: "2025-12-05T10:25:00Z", level: "error", message: "Conexao perdida: timeout" },
]

export default function LogsPage({ params }: LogsPageProps) {
  const { id } = use(params)
  const [logs] = React.useState<LogEntry[]>(mockLogs)

  const getLevelVariant = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return "default"
      case "warn":
        return "secondary"
      case "error":
        return "destructive"
    }
  }

  return (
    <>
      <SessionHeader sessionId={id} pageTitle="Logs" />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Logs</h2>
            <p className="text-muted-foreground">
              Visualize os logs de atividade da sessao
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Logs Recentes
            </CardTitle>
            <CardDescription>
              Ultimas atividades da sessao
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <Badge variant={getLevelVariant(log.level)}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{log.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
