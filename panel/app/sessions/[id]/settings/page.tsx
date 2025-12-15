'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Trash2, LogOut, Key, Shield, Bell, RefreshCw } from 'lucide-react';
import { sessionService } from '@/lib/api/index';
import { useSessionStore } from '@/stores/session-store';

export default function SettingsPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const session = useSessionStore(state => state.sessions.find(s => s.session === sessionId));
  
  const [settings, setSettings] = useState({
    notifications: true,
    autoRead: false,
    autoReply: false,
    webhookEnabled: false,
    webhookUrl: '',
  });

  useEffect(() => {
    loadSettings();
  }, [sessionId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await sessionService.getSessionStatus(sessionId);
      if (response.status) {
        setSettings({
          notifications: true,
          autoRead: false,
          autoReply: false,
          webhookEnabled: false,
          webhookUrl: '',
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await sessionService.logoutSession(sessionId);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar esta sessão?')) return;
    try {
      await sessionService.deleteSession(sessionId);
      window.location.href = '/sessions';
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurações</h2>
          <p className="text-muted-foreground">Gerencie as configurações da sessão</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar
        </Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Informações da Sessão
            </CardTitle>
            <CardDescription>Dados de autenticação e identificação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Session ID</Label>
              <Input value={sessionId} readOnly className="font-mono text-sm" />
            </div>
            {session?.apiKey && (
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input value={session.apiKey} readOnly className="font-mono text-sm" />
              </div>
            )}
            {session?.deviceJid && (
              <div className="space-y-2">
                <Label>Device JID</Label>
                <Input value={session.deviceJid} readOnly className="font-mono text-sm" />
              </div>
            )}
            {session?.phone && (
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={session.phone} readOnly />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>Configure como deseja receber notificações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações Push</Label>
                <p className="text-sm text-muted-foreground">Receba notificações de novas mensagens</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Leitura Automática</Label>
                <p className="text-sm text-muted-foreground">Marcar mensagens como lidas automaticamente</p>
              </div>
              <Switch
                checked={settings.autoRead}
                onCheckedChange={(checked) => setSettings({ ...settings, autoRead: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Resposta Automática</Label>
                <p className="text-sm text-muted-foreground">Ativar resposta automática para mensagens</p>
              </div>
              <Switch
                checked={settings.autoReply}
                onCheckedChange={(checked) => setSettings({ ...settings, autoReply: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Webhooks
            </CardTitle>
            <CardDescription>Configure webhooks para receber eventos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Webhook Ativado</Label>
                <p className="text-sm text-muted-foreground">Enviar eventos para URL configurada</p>
              </div>
              <Switch
                checked={settings.webhookEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, webhookEnabled: checked })}
              />
            </div>
            {settings.webhookEnabled && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>URL do Webhook</Label>
                  <Input
                    placeholder="https://seu-servidor.com/webhook"
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>Ações irreversíveis que afetam sua sessão</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Desconectar Sessão</p>
                <p className="text-sm text-muted-foreground">Fazer logout do WhatsApp</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Deletar Sessão</p>
                <p className="text-sm text-muted-foreground">Remove permanentemente esta sessão</p>
              </div>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
