'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { IconRefresh, IconSearch, IconUserX, IconUser, IconCheck, IconX } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getContacts, checkPhone, getBlocklist, updateBlocklist, type Contact, type CheckPhoneResult } from '@/lib/api'
import { toast } from 'sonner'

export default function ContactsPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [blocklist, setBlocklist] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [checkPhoneNumber, setCheckPhoneNumber] = useState('')
  const [checkResult, setCheckResult] = useState<CheckPhoneResult | null>(null)
  const [checking, setChecking] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [contactsRes, blocklistRes] = await Promise.all([
        getContacts(name),
        getBlocklist(name).catch(() => ({ jids: [] }))
      ])
      setContacts(contactsRes || [])
      setBlocklist(blocklistRes.jids || [])
    } catch (err) {
      toast.error('Erro ao carregar contatos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [name])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCheckPhone = async () => {
    if (!checkPhoneNumber.trim()) return
    try {
      setChecking(true)
      const results = await checkPhone(name, [checkPhoneNumber])
      if (results && results.length > 0) {
        setCheckResult(results[0])
      }
    } catch (err) {
      toast.error('Erro ao verificar numero')
      console.error(err)
    } finally {
      setChecking(false)
    }
  }

  const getPhoneFromJid = (jid: string) => jid.split('@')[0]

  const handleBlock = async (jid: string) => {
    try {
      const phone = getPhoneFromJid(jid)
      await updateBlocklist(name, phone, 'block')
      setBlocklist(prev => [...prev, jid])
      toast.success('Contato bloqueado')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao bloquear contato'
      toast.error(msg)
      console.error('Block error:', err)
    }
  }

  const handleUnblock = async (jid: string) => {
    try {
      const phone = getPhoneFromJid(jid)
      await updateBlocklist(name, phone, 'unblock')
      setBlocklist(prev => prev.filter(b => b !== jid))
      toast.success('Contato desbloqueado')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao desbloquear contato'
      toast.error(msg)
      console.error('Unblock error:', err)
    }
  }

  const filteredContacts = contacts.filter(c => {
    const searchLower = search.toLowerCase()
    return (
      c.fullName?.toLowerCase().includes(searchLower) ||
      c.pushName?.toLowerCase().includes(searchLower) ||
      c.businessName?.toLowerCase().includes(searchLower) ||
      c.jid?.toLowerCase().includes(searchLower)
    )
  })

  const getDisplayName = (contact: Contact) => {
    return contact.fullName || contact.pushName || contact.businessName || contact.firstName || contact.jid?.split('@')[0] || 'Sem nome'
  }

  const getPhone = (contact: Contact) => {
    return contact.jid?.split('@')[0] || ''
  }

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
          <h2 className="text-2xl font-semibold">Contatos</h2>
          <p className="text-muted-foreground">{contacts.length} contatos salvos</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <IconRefresh className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Verificar Numero</CardTitle>
            <CardDescription>Verifica se um numero tem WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="5511999999999"
                value={checkPhoneNumber}
                onChange={(e) => setCheckPhoneNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckPhone()}
              />
              <Button onClick={handleCheckPhone} disabled={checking}>
                {checking ? 'Verificando...' : 'Verificar'}
              </Button>
            </div>
            {checkResult && (
              <div className={`flex items-center gap-2 text-sm ${checkResult.isRegistered ? 'text-green-600' : 'text-red-600'}`}>
                {checkResult.isRegistered ? (
                  <>
                    <IconCheck className="h-4 w-4" />
                    <span>Registrado: {checkResult.jid}</span>
                  </>
                ) : (
                  <>
                    <IconX className="h-4 w-4" />
                    <span>Numero nao registrado no WhatsApp</span>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bloqueados</CardTitle>
            <CardDescription>{blocklist.length} contatos na lista de bloqueio</CardDescription>
          </CardHeader>
          <CardContent>
            {blocklist.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum contato bloqueado</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {blocklist.slice(0, 5).map(jid => (
                  <Badge key={jid} variant="secondary" className="cursor-pointer" onClick={() => handleUnblock(jid)}>
                    {jid.split('@')[0]}
                    <IconX className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
                {blocklist.length > 5 && (
                  <Badge variant="outline">+{blocklist.length - 5} mais</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Lista de Contatos</CardTitle>
            <div className="relative w-64">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
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
                <TableHead>Telefone</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {search ? 'Nenhum contato encontrado' : 'Nenhum contato'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.slice(0, 100).map((contact) => (
                  <TableRow key={contact.jid}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <IconUser className="h-4 w-4 text-muted-foreground" />
                        {getDisplayName(contact)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{getPhone(contact)}</TableCell>
                    <TableCell>
                      {contact.businessName ? (
                        <Badge variant="secondary">Business</Badge>
                      ) : contact.fullName ? (
                        <Badge variant="outline">Salvo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Push</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {blocklist.includes(contact.jid) ? (
                        <Button size="sm" variant="ghost" onClick={() => handleUnblock(contact.jid)}>
                          Desbloquear
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleBlock(contact.jid)}>
                          <IconUserX className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {filteredContacts.length > 100 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Mostrando 100 de {filteredContacts.length} contatos
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
