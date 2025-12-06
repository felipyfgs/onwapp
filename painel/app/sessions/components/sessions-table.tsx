'use client'

import { useRouter } from 'next/navigation'
import { MessageSquare, Users, User, UsersRound, Inbox } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Session } from '@/types/session'
import { SessionStatusBadge } from './session-status-badge'
import { SessionActions } from './session-actions'

interface SessionsTableProps {
  sessions: Session[]
  onUpdate: () => void
}

export function SessionsTable({ sessions, onUpdate }: SessionsTableProps) {
  const router = useRouter()

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getInitials(name: string) {
    return name.slice(0, 2).toUpperCase()
  }

  function handleRowClick(session: Session) {
    router.push(`/dashboard/${session.session}`)
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-4">
          <Inbox className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Nenhuma sessao encontrada</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Crie uma nova sessao para comecar a gerenciar suas conexoes WhatsApp.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b">
            <TableHead className="w-[60px] font-semibold text-gray-600 text-xs uppercase tracking-wider"></TableHead>
            <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider">Sessao</TableHead>
            <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider">Telefone</TableHead>
            <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</TableHead>
            <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider">Estatisticas</TableHead>
            <TableHead className="font-semibold text-gray-600 text-xs uppercase tracking-wider">Criado em</TableHead>
            <TableHead className="w-[60px] font-semibold text-gray-600 text-xs uppercase tracking-wider"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow
              key={session.id}
              className="group cursor-pointer hover:bg-gray-50/80 border-b border-gray-100 transition-all duration-150"
              onClick={() => handleRowClick(session)}
            >
              <TableCell onClick={(e) => e.stopPropagation()} className="py-3">
                <div className="flex items-center justify-center">
                  <Avatar className="h-10 w-10 ring-2 ring-white shadow-md group-hover:scale-105 transition-transform">
                    <AvatarImage src={session.profilePicture} alt={session.session} />
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold text-sm">
                      {getInitials(session.pushName || session.session)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TableCell>
              <TableCell className="py-3">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{session.session}</span>
                  {session.pushName && (
                    <span className="text-xs text-gray-500">{session.pushName}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-3">
                <span className="text-sm text-gray-600 font-mono">
                  {session.phone || '-'}
                </span>
              </TableCell>
              <TableCell className="py-3">
                <SessionStatusBadge status={session.status} />
              </TableCell>
              <TableCell className="py-3">
                {session.stats ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg" title="Mensagens">
                      <MessageSquare className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700">{session.stats.messages}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg" title="Chats">
                      <Users className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700">{session.stats.chats}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-lg" title="Contatos">
                      <User className="h-3 w-3 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-700">{session.stats.contacts}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg" title="Grupos">
                      <UsersRound className="h-3 w-3 text-orange-600" />
                      <span className="text-xs font-semibold text-orange-700">{session.stats.groups}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell className="py-3">
                <span className="text-sm text-gray-600">{formatDate(session.createdAt)}</span>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()} className="py-3">
                <SessionActions session={session} onUpdate={onUpdate} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
