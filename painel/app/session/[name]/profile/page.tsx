'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { IconRefresh, IconEdit, IconCheck, IconX, IconTrash, IconUpload } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  getProfile,
  setProfileName,
  setProfileStatus,
  setProfilePicture,
  removeProfilePicture,
  getPrivacySettings,
  setPrivacySettings,
  type Profile,
  type PrivacySettings
} from '@/lib/api'
import { toast } from 'sonner'

export default function ProfilePage({ params }: { params: Promise<{ name: string }> }) {
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

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const [profileRes, privacyRes] = await Promise.all([
        getProfile(name),
        getPrivacySettings(name).catch(() => null)
      ])
      setProfile(profileRes.profile)
      setPrivacy(privacyRes)
      setNewName(profileRes.profile?.name || '')
      setNewStatus(profileRes.profile?.status || '')
    } catch (err) {
      toast.error('Erro ao carregar perfil')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [name])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl border bg-muted" />
          <div className="h-64 animate-pulse rounded-xl border bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Perfil</h2>
          <p className="text-muted-foreground">Gerencie seu perfil do WhatsApp</p>
        </div>
        <Button onClick={fetchProfile} variant="outline" size="sm">
          <IconRefresh className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacoes do Perfil</CardTitle>
            <CardDescription>Seu nome e status no WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.pictureUrl} />
                <AvatarFallback className="text-2xl">
                  {profile?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="URL da nova foto"
                    value={newPictureUrl}
                    onChange={(e) => setNewPictureUrl(e.target.value)}
                    className="w-48"
                  />
                  <Button size="sm" onClick={handleUpdatePicture} disabled={saving || !newPictureUrl}>
                    <IconUpload className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="sm" variant="destructive" onClick={handleRemovePicture} disabled={saving}>
                  <IconTrash className="mr-2 h-4 w-4" />
                  Remover Foto
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome</Label>
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <Button size="sm" onClick={handleSaveName} disabled={saving}>
                    <IconCheck className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>{profile?.name || 'Nao definido'}</span>
                  <Button size="sm" variant="ghost" onClick={() => setEditingName(true)}>
                    <IconEdit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              {editingStatus ? (
                <div className="flex gap-2">
                  <Input
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveStatus()}
                    placeholder="Seu status..."
                  />
                  <Button size="sm" onClick={handleSaveStatus} disabled={saving}>
                    <IconCheck className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingStatus(false)}>
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-muted-foreground">{profile?.status || 'Nao definido'}</span>
                  <Button size="sm" variant="ghost" onClick={() => setEditingStatus(true)}>
                    <IconEdit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>JID</Label>
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                {profile?.jid || 'Nao disponivel'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacidade</CardTitle>
            <CardDescription>Controle quem pode ver suas informacoes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Visto por ultimo</Label>
              <Select
                value={privacy?.lastSeen || 'all'}
                onValueChange={(v) => handlePrivacyChange('lastSeen', v)}
              >
                <SelectTrigger>
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
              <Label>Foto do perfil</Label>
              <Select
                value={privacy?.profile || 'all'}
                onValueChange={(v) => handlePrivacyChange('profile', v)}
              >
                <SelectTrigger>
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
              <Label>Status</Label>
              <Select
                value={privacy?.status || 'all'}
                onValueChange={(v) => handlePrivacyChange('status', v)}
              >
                <SelectTrigger>
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
              <Label>Quem pode me adicionar em grupos</Label>
              <Select
                value={privacy?.groupAdd || 'all'}
                onValueChange={(v) => handlePrivacyChange('groupAdd', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="contacts">Meus contatos</SelectItem>
                  <SelectItem value="contact_blacklist">Contatos exceto...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Confirmacao de leitura</Label>
              <Select
                value={privacy?.readReceipts || 'all'}
                onValueChange={(v) => handlePrivacyChange('readReceipts', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ativado</SelectItem>
                  <SelectItem value="none">Desativado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
