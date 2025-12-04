'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { IconRefresh, IconSearch, IconUsers, IconLink, IconLogout, IconCopy, IconPlus } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { getGroups, getGroupInviteLink, leaveGroup, createGroup, type Group } from '@/lib/api'
import { toast } from 'sonner'

export default function GroupsPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params)
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupParticipants, setNewGroupParticipants] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getGroups(name)
      setGroups(res.data || [])
    } catch (err) {
      toast.error('Erro ao carregar grupos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [name])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleGetInviteLink = async (jid: string) => {
    try {
      const res = await getGroupInviteLink(name, jid)
      await navigator.clipboard.writeText(res.link)
      toast.success('Link copiado para a area de transferencia')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao obter link do grupo'
      if (msg.includes('permission')) {
        toast.error('Voce precisa ser admin do grupo para obter o link')
      } else {
        toast.error(msg)
      }
    }
  }

  const handleLeaveGroup = async (jid: string, groupName: string) => {
    if (!confirm(`Tem certeza que deseja sair do grupo "${groupName}"?`)) return
    try {
      await leaveGroup(name, jid)
      setGroups(prev => prev.filter(g => g.jid !== jid))
      toast.success('Voce saiu do grupo')
    } catch (err) {
      toast.error('Erro ao sair do grupo')
      console.error(err)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Nome do grupo e obrigatorio')
      return
    }
    try {
      setCreating(true)
      const participants = newGroupParticipants
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0)
      await createGroup(name, newGroupName, participants)
      toast.success('Grupo criado com sucesso')
      setCreateDialogOpen(false)
      setNewGroupName('')
      setNewGroupParticipants('')
      fetchGroups()
    } catch (err) {
      toast.error('Erro ao criar grupo')
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const filteredGroups = groups.filter(g => {
    const searchLower = search.toLowerCase()
    return (
      g.name?.toLowerCase().includes(searchLower) ||
      g.topic?.toLowerCase().includes(searchLower) ||
      g.jid?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl border bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Grupos</h2>
          <p className="text-muted-foreground">{groups.length} grupos</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <IconPlus className="mr-2 h-4 w-4" />
                Criar Grupo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Grupo</DialogTitle>
                <DialogDescription>Crie um novo grupo no WhatsApp</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Nome do Grupo</Label>
                  <Input
                    id="groupName"
                    placeholder="Meu Grupo"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participants">Participantes (opcional)</Label>
                  <Input
                    id="participants"
                    placeholder="5511999999999, 5511888888888"
                    value={newGroupParticipants}
                    onChange={(e) => setNewGroupParticipants(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Separe os numeros por virgula</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateGroup} disabled={creating}>
                  {creating ? 'Criando...' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={fetchGroups} variant="outline" size="sm">
            <IconRefresh className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Grupos</CardDescription>
            <CardTitle className="text-3xl">{groups.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Participantes</CardDescription>
            <CardTitle className="text-3xl">
              {groups.reduce((acc, g) => acc + (g.participants?.length || 0), 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sou Admin</CardDescription>
            <CardTitle className="text-3xl">
              {groups.filter(g => g.participants?.some(p => p.isSuperAdmin || p.isAdmin)).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Lista de Grupos</CardTitle>
            <div className="relative w-64">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar grupos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Participantes</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {search ? 'Nenhum grupo encontrado' : 'Nenhum grupo'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups.map((group) => (
                  <TableRow key={group.jid}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <IconUsers className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{group.name || 'Sem nome'}</div>
                          {group.announce && <Badge variant="secondary" className="text-xs">Anuncio</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{group.participants?.length || 0}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {group.topic || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleGetInviteLink(group.jid)} title="Copiar link">
                          <IconLink className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleLeaveGroup(group.jid, group.name)} title="Sair do grupo">
                          <IconLogout className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
