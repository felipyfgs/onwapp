'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Image as ImageIcon, Video, Type, RefreshCw } from 'lucide-react';
import statusService from '@/lib/api/status';
import type { Status } from '@/lib/types/api';

type StatusType = 'all' | 'image' | 'video' | 'text';

export default function StatusPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [activeTab, setActiveTab] = useState<StatusType>('all');
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStatus, setNewStatus] = useState({ type: 'text', content: '' });

  useEffect(() => {
    loadStatuses();
  }, [sessionId]);

  const loadStatuses = async () => {
    setLoading(true);
    try {
      const response = await statusService.getStatuses(sessionId);
      setStatuses(response || []);
    } catch (error) {
      console.error('Failed to load statuses:', error);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStatus = async () => {
    try {
      if (newStatus.type === 'text') {
        await statusService.sendTextStatus(sessionId, newStatus.content);
      } else if (newStatus.type === 'image') {
        await statusService.sendImageStatus(sessionId, newStatus.content);
      } else if (newStatus.type === 'video') {
        await statusService.sendVideoStatus(sessionId, newStatus.content);
      }
      setNewStatus({ type: 'text', content: '' });
      setShowCreateForm(false);
      loadStatuses();
    } catch (error) {
      console.error('Failed to create status:', error);
    }
  };

  const filteredStatuses = statuses.filter(status => {
    if (activeTab === 'all') return true;
    return status.mediaType === activeTab;
  });

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
          <h2 className="text-2xl font-bold">Status</h2>
          <p className="text-muted-foreground">Visualize e publique stories do WhatsApp</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Status
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={newStatus.type === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewStatus({ ...newStatus, type: 'text' })}
                >
                  <Type className="h-4 w-4 mr-2" />
                  Texto
                </Button>
                <Button
                  variant={newStatus.type === 'image' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewStatus({ ...newStatus, type: 'image' })}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Imagem
                </Button>
                <Button
                  variant={newStatus.type === 'video' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewStatus({ ...newStatus, type: 'video' })}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Vídeo
                </Button>
              </div>

              {newStatus.type === 'text' ? (
                <Textarea
                  placeholder="Digite seu status..."
                  value={newStatus.content}
                  onChange={(e) => setNewStatus({ ...newStatus, content: e.target.value })}
                  className="min-h-[120px]"
                />
              ) : (
                <Input
                  type="file"
                  accept={newStatus.type === 'image' ? 'image/*' : 'video/*'}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setNewStatus({ ...newStatus, content: URL.createObjectURL(file) });
                  }}
                />
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateStatus} disabled={!newStatus.content}>
                  Publicar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StatusType)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="text">Texto</TabsTrigger>
          <TabsTrigger value="image">Imagens</TabsTrigger>
          <TabsTrigger value="video">Vídeos</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredStatuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold">Nenhum status encontrado</h3>
              <p className="text-sm text-muted-foreground">Publique seu primeiro status para começar</p>
              <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Status
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredStatuses.map((status) => (
                <Card key={status.id} className="overflow-hidden group cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-0">
                    {status.mediaType === 'text' ? (
                      <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
                        <p className="text-white text-center font-medium line-clamp-6">
                          {status.text}
                        </p>
                      </div>
                    ) : status.mediaType === 'image' ? (
                      <div className="aspect-square bg-muted">
                        <img src={status.mediaUrl} alt="Status" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        <Video className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(status.timestamp).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
