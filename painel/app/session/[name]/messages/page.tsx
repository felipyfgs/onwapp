'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { IconRefresh, IconSend, IconPhoto, IconFile, IconMapPin, IconMessage } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { sendTextMessage, sendImageMessage, sendDocumentMessage, sendLocationMessage, getUnreadChats, type UnreadChat } from '@/lib/api'
import { toast } from 'sonner'

export default function MessagesPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params)
  const [unreadChats, setUnreadChats] = useState<UnreadChat[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Form states
  const [phone, setPhone] = useState('')
  const [textMessage, setTextMessage] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageCaption, setImageCaption] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [documentFilename, setDocumentFilename] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [locationName, setLocationName] = useState('')

  const fetchUnreadChats = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getUnreadChats(name)
      setUnreadChats(res.chats || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [name])

  useEffect(() => {
    fetchUnreadChats()
  }, [fetchUnreadChats])

  const handleSendText = async () => {
    if (!phone.trim() || !textMessage.trim()) {
      toast.error('Preencha o telefone e a mensagem')
      return
    }
    try {
      setSending(true)
      await sendTextMessage(name, phone, textMessage)
      toast.success('Mensagem enviada')
      setTextMessage('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar mensagem'
      toast.error(msg)
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleSendImage = async () => {
    if (!phone.trim() || !imageUrl.trim()) {
      toast.error('Preencha o telefone e a URL da imagem')
      return
    }
    try {
      setSending(true)
      await sendImageMessage(name, phone, imageUrl, imageCaption || undefined)
      toast.success('Imagem enviada')
      setImageUrl('')
      setImageCaption('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar imagem'
      toast.error(msg)
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleSendDocument = async () => {
    if (!phone.trim() || !documentUrl.trim() || !documentFilename.trim()) {
      toast.error('Preencha o telefone, URL e nome do arquivo')
      return
    }
    try {
      setSending(true)
      await sendDocumentMessage(name, phone, documentUrl, documentFilename)
      toast.success('Documento enviado')
      setDocumentUrl('')
      setDocumentFilename('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar documento'
      toast.error(msg)
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleSendLocation = async () => {
    if (!phone.trim() || !latitude.trim() || !longitude.trim()) {
      toast.error('Preencha o telefone, latitude e longitude')
      return
    }
    try {
      setSending(true)
      await sendLocationMessage(name, phone, parseFloat(latitude), parseFloat(longitude), locationName || undefined)
      toast.success('Localizacao enviada')
      setLatitude('')
      setLongitude('')
      setLocationName('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar localizacao'
      toast.error(msg)
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const selectChat = (jid: string) => {
    setPhone(jid.split('@')[0])
  }

  const totalUnread = unreadChats.reduce((acc, c) => acc + c.unreadCount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Mensagens</h2>
          <p className="text-muted-foreground">Envie mensagens e veja chats nao lidos</p>
        </div>
        <Button onClick={fetchUnreadChats} variant="outline" size="sm">
          <IconRefresh className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enviar Mensagem</CardTitle>
            <CardDescription>Envie mensagens para qualquer numero</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="5511999999999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="text"><IconMessage className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="image"><IconPhoto className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="document"><IconFile className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="location"><IconMapPin className="h-4 w-4" /></TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-3">
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleSendText} disabled={sending} className="w-full">
                  <IconSend className="mr-2 h-4 w-4" />
                  {sending ? 'Enviando...' : 'Enviar Texto'}
                </Button>
              </TabsContent>

              <TabsContent value="image" className="space-y-3">
                <Input
                  placeholder="URL da imagem"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <Input
                  placeholder="Legenda (opcional)"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                />
                <Button onClick={handleSendImage} disabled={sending} className="w-full">
                  <IconPhoto className="mr-2 h-4 w-4" />
                  {sending ? 'Enviando...' : 'Enviar Imagem'}
                </Button>
              </TabsContent>

              <TabsContent value="document" className="space-y-3">
                <Input
                  placeholder="URL do documento"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                />
                <Input
                  placeholder="Nome do arquivo (obrigatorio)"
                  value={documentFilename}
                  onChange={(e) => setDocumentFilename(e.target.value)}
                />
                <Button onClick={handleSendDocument} disabled={sending} className="w-full">
                  <IconFile className="mr-2 h-4 w-4" />
                  {sending ? 'Enviando...' : 'Enviar Documento'}
                </Button>
              </TabsContent>

              <TabsContent value="location" className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                  <Input
                    placeholder="Longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Nome do local (opcional)"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                />
                <Button onClick={handleSendLocation} disabled={sending} className="w-full">
                  <IconMapPin className="mr-2 h-4 w-4" />
                  {sending ? 'Enviando...' : 'Enviar Localizacao'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Chats Nao Lidos
              {totalUnread > 0 && <Badge>{totalUnread}</Badge>}
            </CardTitle>
            <CardDescription>Clique em um chat para selecionar o numero</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : unreadChats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum chat nao lido</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-right">Nao Lidas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unreadChats.map((chat) => (
                    <TableRow
                      key={chat.jid}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => selectChat(chat.jid)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{chat.name || chat.jid.split('@')[0]}</div>
                          <div className="text-xs text-muted-foreground">{chat.jid.split('@')[0]}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={chat.unreadCount > 0 ? 'default' : 'secondary'}>
                          {chat.unreadCount}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
