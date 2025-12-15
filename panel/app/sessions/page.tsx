'use client';

import { useEffect, useState } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { useGlobalStore } from '@/stores/global-store';
import apiClient from '@/lib/api';
import { SessionCard } from '@/components/session/session-card';
import { CreateSessionDialog } from '@/components/session/create-session-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Smartphone 
} from 'lucide-react';

export default function SessionsPage() {
  const { sessions, loading, setSessions, setLoading } = useSessionStore();
  const natsConnected = useGlobalStore((state) => state.natsConnected);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'connected' | 'disconnected' | 'connecting'>('all');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/sessions');
      const data = Array.isArray(response.data) ? response.data : [];
      setSessions(data.filter((session: any) => session && session.session));
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter((session) => {
    if (!session || !session.session) return false;
    const matchesSearch = session.session.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || session.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: sessions.length,
    connected: sessions.filter((s) => s.status === 'connected').length,
    disconnected: sessions.filter((s) => s.status === 'disconnected').length,
    connecting: sessions.filter((s) => s.status === 'connecting').length,
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">OnWapp Panel</h1>
                <p className="text-xs text-muted-foreground">WhatsApp Multi-Device API</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={natsConnected ? 'default' : 'destructive'} className="gap-1">
                {natsConnected ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    Live
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </>
                )}
              </Badge>
              <CreateSessionDialog />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Suas Sessões</h2>
              <p className="text-muted-foreground">
                Gerencie e monitore suas instâncias do WhatsApp
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSessions}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                filter === 'all' ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
                  <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </button>

            <button
              onClick={() => setFilter('connected')}
              className={`rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                filter === 'connected' ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conectadas</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.connected}
                  </p>
                </div>
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                  <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </button>

            <button
              onClick={() => setFilter('connecting')}
              className={`rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                filter === 'connecting' ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conectando</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.connecting}
                  </p>
                </div>
                <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/20">
                  <RefreshCw className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </button>

            <button
              onClick={() => setFilter('disconnected')}
              className={`rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                filter === 'disconnected' ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Desconectadas</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.disconnected}
                  </p>
                </div>
                <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                  <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar sessões por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Session Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="mx-auto mb-4 h-12 w-12 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Carregando sessões...</p>
            </div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Smartphone className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold">
              {search || filter !== 'all' ? 'Nenhuma sessão encontrada' : 'Nenhuma sessão criada'}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {search || filter !== 'all'
                ? 'Tente ajustar sua busca ou filtro'
                : 'Crie sua primeira sessão para começar'}
            </p>
            {!search && filter === 'all' && <CreateSessionDialog />}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>
            Onwapp Panel · WhatsApp Multi-Device API ·{' '}
            <span className="font-medium">
              {sessions.length} {sessions.length === 1 ? 'sessão' : 'sessões'}
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
