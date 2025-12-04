'use client'

import { useState } from 'react'
import {
  IconPlugConnected,
  IconPlugConnectedX,
  IconQrcode,
  IconLoader2,
  IconTrash,
  IconCopy,
  IconCheck,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Session, SessionStatusType } from '@/lib/types'

interface SessionsTableProps {
  sessions: Session[]
  onConnect: (name: string) => Promise<void>
  onDisconnect: (name: string) => Promise<void>
  onDelete: (name: string) => Promise<void>
  onShowQR: (name: string) => void
  onRowClick?: (session: Session) => void
}

const statusConfig: Record<SessionStatusType, {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  icon: typeof IconPlugConnected
  dotColor: string
  badgeClass?: string
}> = {
  connected: {
    label: 'Conectado',
    variant: 'default',
    icon: IconPlugConnected,
    dotColor: 'bg-green-500',
    badgeClass: 'bg-green-600 hover:bg-green-600 text-white',
  },
  disconnected: {
    label: 'Desconectado',
    variant: 'destructive',
    icon: IconPlugConnectedX,
    dotColor: 'bg-red-500',
  },
  qr_pending: {
    label: 'Aguardando QR',
    variant: 'secondary',
    icon: IconQrcode,
    dotColor: 'bg-yellow-500',
  },
  connecting: {
    label: 'Conectando',
    variant: 'outline',
    icon: IconLoader2,
    dotColor: 'bg-blue-500 animate-pulse',
  },
}

function getInitials(name: string): string {
  return name
    .split(/[-_\s]/)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

function formatPhone(phone: string): string {
  return '+' + phone.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '$1 $2 $3-$4')
}

export function SessionsTable({
  sessions,
  onConnect,
  onDisconnect,
  onDelete,
  onShowQR,
  onRowClick,
}: SessionsTableProps) {
  const [loadingSession, setLoadingSession] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const handleAction = async (name: string, action: () => Promise<void>) => {
    setLoadingSession(name)
    try {
      await action()
    } finally {
      setLoadingSession(null)
    }
  }

  const handleCopyApiKey = async (e: React.MouseEvent, sessionName: string, apiKey: string) => {
    e.stopPropagation()
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(apiKey)
      } else {
        // Fallback for HTTP contexts
        const textArea = document.createElement('textarea')
        textArea.value = apiKey
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopiedKey(sessionName)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      console.error('Failed to copy')
    }
  }

  const toggleKeyVisibility = (e: React.MouseEvent, sessionName: string) => {
    e.stopPropagation()
    setVisibleKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionName)) {
        newSet.delete(sessionName)
      } else {
        newSet.add(sessionName)
      }
      return newSet
    })
  }

  const maskApiKey = (apiKey: string) => {
    if (apiKey.length <= 8) return '••••••••'
    return apiKey.slice(0, 4) + '••••••••' + apiKey.slice(-4)
  }

  return (
    <TooltipProvider delayDuration={300}>
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Sessao</TableHead>
            <TableHead className="w-[250px]">Perfil</TableHead>
            <TableHead className="w-[220px]">API Key</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Chats</TableHead>
            <TableHead className="text-center">Contatos</TableHead>
            <TableHead className="text-center">Grupos</TableHead>
            <TableHead className="text-center">Msgs</TableHead>
            <TableHead className="w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                Nenhuma sessao encontrada
              </TableCell>
            </TableRow>
          ) : (
            sessions.map((session) => {
              const config = statusConfig[session.status] || statusConfig.disconnected
              const stats = session.stats || { messages: 0, chats: 0, contacts: 0, groups: 0 }
              const isLoading = loadingSession === session.name

              return (
                <TableRow
                  key={session.id}
                  className="cursor-pointer"
                  onClick={() => onRowClick?.(session)}
                >
                  {/* Nome da Sessao */}
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded font-semibold">
                      {session.name}
                    </code>
                  </TableCell>

                  {/* Perfil */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={session.profilePicture} alt={session.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(session.pushName || session.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${config.dotColor}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {session.pushName || '-'}
                        </p>
                        <p className="text-sm text-muted-foreground font-mono truncate">
                          {session.phone ? formatPhone(session.phone) : '-'}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* API Key */}
                  <TableCell>
                    {session.apiKey ? (
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate max-w-[140px]">
                          {visibleKeys.has(session.name) ? session.apiKey : maskApiKey(session.apiKey)}
                        </code>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={(e) => toggleKeyVisibility(e, session.name)}
                            >
                              {visibleKeys.has(session.name) ? (
                                <IconEyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <IconEye className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {visibleKeys.has(session.name) ? 'Ocultar' : 'Mostrar'}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={(e) => handleCopyApiKey(e, session.name, session.apiKey!)}
                            >
                              {copiedKey === session.name ? (
                                <IconCheck className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <IconCopy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {copiedKey === session.name ? 'Copiado!' : 'Copiar'}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={config.variant} className={`gap-1 ${config.badgeClass || ''}`}>
                      <config.icon className={`h-3 w-3 ${session.status === 'connecting' ? 'animate-spin' : ''}`} />
                      {config.label}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center font-medium">
                    {session.status === 'connected' ? formatNumber(stats.chats) : '-'}
                  </TableCell>

                  <TableCell className="text-center font-medium">
                    {session.status === 'connected' ? formatNumber(stats.contacts) : '-'}
                  </TableCell>

                  <TableCell className="text-center font-medium">
                    {session.status === 'connected' ? formatNumber(stats.groups) : '-'}
                  </TableCell>

                  <TableCell className="text-center font-medium">
                    {session.status === 'connected' ? formatNumber(stats.messages) : '-'}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {session.status === 'disconnected' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                              onClick={() => handleAction(session.name, () => onConnect(session.name))}
                              disabled={isLoading}
                            >
                              {isLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconPlugConnected className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Conectar</TooltipContent>
                        </Tooltip>
                      )}

                      {session.status === 'connected' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleAction(session.name, () => onDisconnect(session.name))}
                              disabled={isLoading}
                            >
                              {isLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconPlugConnectedX className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Desconectar</TooltipContent>
                        </Tooltip>
                      )}

                      {(session.status === 'qr_pending' || session.status === 'connecting') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                              onClick={() => onShowQR(session.name)}
                            >
                              <IconQrcode className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver QR Code</TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleAction(session.name, () => onDelete(session.name))}
                            disabled={isLoading}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
    </TooltipProvider>
  )
}
