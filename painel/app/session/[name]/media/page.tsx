'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { IconRefresh, IconPhoto, IconVideo, IconFile, IconMusic, IconDownload, IconLoader } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getMediaList, getPendingMedia, processMedia, type MediaItem } from '@/lib/api'
import { toast } from 'sonner'

const mediaTypeIcons: Record<string, typeof IconPhoto> = {
  image: IconPhoto,
  video: IconVideo,
  audio: IconMusic,
  document: IconFile,
  sticker: IconPhoto,
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MediaPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [pending, setPending] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [total, setTotal] = useState(0)

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true)
      const type = typeFilter === 'all' ? undefined : typeFilter
      const [mediaRes, pendingRes] = await Promise.all([
        getMediaList(name, undefined, type, 100),
        getPendingMedia(name).catch(() => ({ media: [], count: 0 }))
      ])
      setMedia(mediaRes.media || [])
      setTotal(mediaRes.count || 0)
      setPending(pendingRes.media || [])
    } catch (err) {
      toast.error('Erro ao carregar midias')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [name, typeFilter])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  const handleProcessPending = async () => {
    try {
      setProcessing(true)
      const res = await processMedia(name)
      toast.success(`${res.processed} midias processadas`)
      fetchMedia()
    } catch (err) {
      toast.error('Erro ao processar midias')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const getMediaIcon = (mediaType: string) => {
    const Icon = mediaTypeIcons[mediaType] || IconFile
    return <Icon className="h-4 w-4" />
  }

  const getMediaStats = () => {
    const stats: Record<string, number> = {}
    media.forEach(m => {
      stats[m.mediaType] = (stats[m.mediaType] || 0) + 1
    })
    return stats
  }

  const stats = getMediaStats()

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl border bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Midia</h2>
          <p className="text-muted-foreground">{total} arquivos de midia</p>
        </div>
        <div className="flex gap-2">
          {pending.length > 0 && (
            <Button onClick={handleProcessPending} disabled={processing} size="sm">
              {processing ? (
                <IconLoader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <IconDownload className="mr-2 h-4 w-4" />
              )}
              Processar {pending.length} Pendentes
            </Button>
          )}
          <Button onClick={fetchMedia} variant="outline" size="sm">
            <IconRefresh className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <IconPhoto className="h-3 w-3" /> Imagens
            </CardDescription>
            <CardTitle className="text-2xl">{stats.image || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <IconVideo className="h-3 w-3" /> Videos
            </CardDescription>
            <CardTitle className="text-2xl">{stats.video || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <IconMusic className="h-3 w-3" /> Audios
            </CardDescription>
            <CardTitle className="text-2xl">{stats.audio || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <IconFile className="h-3 w-3" /> Documentos
            </CardDescription>
            <CardTitle className="text-2xl">{stats.document || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Arquivos de Midia</CardTitle>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="image">Imagens</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="audio">Audios</SelectItem>
                <SelectItem value="document">Documentos</SelectItem>
                <SelectItem value="sticker">Stickers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Chat</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {media.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma midia encontrada
                  </TableCell>
                </TableRow>
              ) : (
                media.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMediaIcon(item.mediaType)}
                        <span className="capitalize">{item.mediaType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.fileName || item.msgId}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.chatJid?.split('@')[0] || '-'}
                    </TableCell>
                    <TableCell>{item.fileSize ? formatBytes(item.fileSize) : '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.createdAt ? formatDate(item.createdAt) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.downloaded ? 'default' : 'secondary'}>
                        {item.downloaded ? 'Baixado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {media.length > 0 && media.length < total && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Mostrando {media.length} de {total} midias
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
