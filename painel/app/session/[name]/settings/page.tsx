'use client'

import { use, useEffect, useState, useCallback } from 'react'
import {
  IconRefresh,
  IconEdit,
  IconCheck,
  IconX,
  IconTrash,
  IconUpload,
  IconUser,
  IconShield,
  IconClock,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import {
  getProfile,
  setProfileName,
  setProfileStatus,
  setProfilePicture,
  removeProfilePicture,
  getPrivacySettings,
  setPrivacySettings,
  setDefaultDisappearingTimer,
  type Profile,
  type PrivacySettings
} from '@/lib/api'
import { toast } from 'sonner'

export default function SettingsPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit states
  const [editingName, setEditingName] = useState(false)
  const [editingStatus, setEditingStatus] = useState(false)
  const [newName, setNewName] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [newPictureUrl, setNewPictureUrl] = useState('')
  const [disappearingTimer, setDisappearingTimer] = useState<string>('0')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [profileRes, privacyRes] = await Promise.all([
        getProfile(name).catch(() => ({ profile: null })),
        getPrivacySettings(name).catch(() => null),
      ])
      setProfile(profileRes.profile)
      setPrivacy(privacyRes)
      setNewName(profileRes.profile?.name || '')
      setNewStatus(profileRes.profile?.status || '')
    } catch (err) {
      toast.error('Erro ao carregar configuracoes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [name])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Profile handlers
  const handleSaveName = async () => {
    if (!newName.trim()) {
      toast.error('Nome nao pode ser vazio')
      return
    }
    try {
      setSaving(true)
      await setProfileName(name, newName)
      setProfile(prev => prev ? { ...prev, name: newName } : null)
      setEditingName(false)
      toast.success('Nome atualizado')
    } catch (err) {
      toast.error('Erro ao atualizar nome')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveStatus = async () => {
    try {
      setSaving(true)
      await setProfileStatus(name, newStatus)
      setProfile(prev => prev ? { ...prev, status: newStatus } : null)
      setEditingStatus(false)
      toast.success('Status atualizado')
    } catch (err) {
      toast.error('Erro ao atualizar status')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePicture = async () => {
    if (!newPictureUrl.trim()) {
      toast.error('URL da imagem e obrigatoria')
      return
    }
    try {
      setSaving(true)
      await setProfilePicture(name, newPictureUrl)
      setProfile(prev => prev ? { ...prev, pictureUrl: newPictureUrl } : null)
      setNewPictureUrl('')
      toast.success('Foto atualizada')
    } catch (err) {
      toast.error('Erro ao atualizar foto')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleRemovePicture = async () => {
    if (!confirm('Tem certeza que deseja remover a foto de perfil?')) return
    try {
      setSaving(true)
      await removeProfilePicture(name)
      setProfile(prev => prev ? { ...prev, pictureUrl: undefined } : null)
      toast.success('Foto removida')
    } catch (err) {
      toast.error('Erro ao remover foto')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Privacy handlers
  const handlePrivacyChange = async (key: keyof PrivacySettings, value: string) => {
    try {
      const newSettings = { ...privacy, [key]: value }
      await setPrivacySettings(name, { [key]: value })
      setPrivacy(newSettings)
      toast.success('Privacidade atualizada')
    } catch (err) {
      toast.error('Erro ao atualizar privacidade')
      console.error(err)
    }
  }

  const handleReadReceiptsToggle = async (enabled: boolean) => {
    await handlePrivacyChange('readReceipts', enabled ? 'all' : 'none')
  }

  const handleDisappearingTimer = async (value: string) => {
    try {
      const duration = parseInt(value)
      await setDefaultDisappearingTimer(name, duration)
      setDisappearingTimer(value)
      toast.success('Timer atualizado')
    } catch (err) {
      toast.error('Erro ao atualizar timer')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Configuracoes</h2>
          <p className="text-muted-foreground">Gerencie sua sessao do WhatsApp</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <IconRefresh className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconUser className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Perfil</CardTitle>
                <CardDescription>Nome, status e foto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.pictureUrl} />
                <AvatarFallback className="text-xl">
                  {profile?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex gap-2">
                  <Input
                    placeholder="URL da foto"
                    value={newPictureUrl}
                    onChange={(e) => setNewPictureUrl(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={handleUpdatePicture} disabled={saving || !newPictureUrl}>
                    <IconUpload className="h-3 w-3" />
                  </Button>
                </div>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={handleRemovePicture} disabled={saving}>
                  <IconTrash className="mr-1 h-3 w-3" />
                  Remover
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Nome</Label>
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="h-8"
                  />
                  <Button size="sm" variant="outline" onClick={handleSaveName} disabled={saving}>
                    <IconCheck className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
                    <IconX className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                  <span>{profile?.name || 'Nao definido'}</span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingName(true)}>
                    <IconEdit className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              {editingStatus ? (
                <div className="flex gap-2">
                  <Input
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveStatus()}
                    className="h-8"
                  />
                  <Button size="sm" variant="outline" onClick={handleSaveStatus} disabled={saving}>
                    <IconCheck className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingStatus(false)}>
                    <IconX className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                  <span className="text-muted-foreground">{profile?.status || 'Nao definido'}</span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingStatus(true)}>
                    <IconEdit className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Privacy Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconShield className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Privacidade</CardTitle>
                <CardDescription>Controle de visibilidade</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Confirmacao de leitura</Label>
                <p className="text-xs text-muted-foreground">Mostrar quando voce leu mensagens</p>
              </div>
              <Switch
                checked={privacy?.readReceipts === 'all'}
                onCheckedChange={handleReadReceiptsToggle}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Visto por ultimo</Label>
              <Select value={privacy?.lastSeen || 'all'} onValueChange={(v) => handlePrivacyChange('lastSeen', v)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="contacts">Meus contatos</SelectItem>
                  <SelectItem value="contact_blacklist">Contatos exceto...</SelectItem>
                  <SelectItem value="none">Ninguem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Foto do perfil</Label>
              <Select value={privacy?.profile || 'all'} onValueChange={(v) => handlePrivacyChange('profile', v)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="contacts">Meus contatos</SelectItem>
                  <SelectItem value="contact_blacklist">Contatos exceto...</SelectItem>
                  <SelectItem value="none">Ninguem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Adicionar em grupos</Label>
              <Select value={privacy?.groupAdd || 'all'} onValueChange={(v) => handlePrivacyChange('groupAdd', v)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="contacts">Meus contatos</SelectItem>
                  <SelectItem value="contact_blacklist">Contatos exceto...</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Disappearing Messages Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconClock className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Mensagens temporarias</CardTitle>
                <CardDescription>Timer padrao para novas conversas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Select value={disappearingTimer} onValueChange={handleDisappearingTimer}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Desativado</SelectItem>
                <SelectItem value="86400">24 horas</SelectItem>
                <SelectItem value="604800">7 dias</SelectItem>
                <SelectItem value="7776000">90 dias</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
