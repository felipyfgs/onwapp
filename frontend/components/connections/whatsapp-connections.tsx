"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Plus, RefreshCw, Trash2, Settings2, QrCode } from "lucide-react"
import { WhatsAppConnection } from "@/lib/nats/nats-types"
import { QRCodeModal } from "./qrcode-modal"
import { cn } from "@/lib/utils"

const mockConnections: WhatsAppConnection[] = [
  {
    id: "1",
    name: "WhatsApp Principal",
    number: "5511999999999",
    status: "connected"
  },
  {
    id: "2",
    name: "Suporte Vendas",
    number: "5511988888888",
    status: "disconnected"
  }
]

export function WhatsAppConnections() {
  const [connections, setConnections] = useState<WhatsAppConnection[]>(mockConnections)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null)

  const handleOpenQR = (id: string) => {
    setSelectedConnId(id)
    setQrModalOpen(true)
  }

  const getStatusConfig = (status: WhatsAppConnection['status']) => {
    switch (status) {
      case 'connected':
        return { label: 'Conectado', color: 'bg-chart-2', variant: 'default' as const }
      case 'connecting':
        return { label: 'Conectando', color: 'bg-chart-4 animate-pulse', variant: 'secondary' as const }
      case 'disconnected':
        return { label: 'Desconectado', color: 'bg-destructive', variant: 'destructive' as const }
      case 'qrcode':
        return { label: 'Aguardando QR', color: 'bg-chart-4', variant: 'outline' as const }
      default:
        return { label: status, color: 'bg-muted', variant: 'outline' as const }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Conexões</h2>
          <p className="text-muted-foreground">Gerencie suas instâncias do WhatsApp</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conexão
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connections.map((conn) => {
          const config = getStatusConfig(conn.status)
          return (
            <Card key={conn.id} className="overflow-hidden">
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-full bg-background border", conn.status === 'connected' ? "text-chart-2 border-chart-2/20" : "text-muted-foreground")}>
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{conn.name}</CardTitle>
                      <CardDescription>{conn.number}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={config.variant} className={cn("h-5", conn.status === 'connecting' && "animate-pulse")}>
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Última atividade:</span>
                    <span>Hoje às 10:30</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Versão:</span>
                    <span>2.3000.101</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t p-3 flex justify-between">
                <div className="flex gap-2">
                  {conn.status === 'disconnected' || conn.status === 'qrcode' ? (
                    <Button size="sm" variant="default" className="gap-2 bg-chart-2 hover:bg-chart-2/90" onClick={() => handleOpenQR(conn.id)}>
                      <QrCode className="h-4 w-4" />
                      Conectar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Reiniciar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <QRCodeModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        onRefresh={() => console.log('Refresh QR Code for', selectedConnId)}
      />
    </div>
  )
}
