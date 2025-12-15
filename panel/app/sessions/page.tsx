'use client';

import { useEffect, useState } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { useGlobalStore } from '@/stores/global-store';
import { useTheme } from '@/providers/theme-provider';
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
  Smartphone,
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react';

export default function SessionsPage() {
  const { sessions, loading, setSessions, setLoading } = useSessionStore();
  const natsConnected = useGlobalStore((state) => state.natsConnected);
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'connected' | 'disconnected' | 'connecting'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/sessions');
      const data = Array.isArray(response.data) ? response.data : [];
      setSessions(data.filter((session: { session?: string }) => session && session.session));
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

  const filterButtons = [
    { key: 'all' as const, label: 'Todas', count: stats.total },
    { key: 'connected' as const, label: 'Conectadas', count: stats.connected },
    { key: 'disconnected' as const, label: 'Desconectadas', count: stats.disconnected },
    { key: 'connecting' as const, label: 'Conectando', count: stats.connecting },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 hover:bg-accent lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold">OnWapp</h1>
                <p className="text-xs text-muted-foreground">WhatsApp Multi-Device API</p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <Badge 
              variant={natsConnected ? 'default' : 'destructive'} 
              className="gap-1 hidden sm:flex"
            >
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
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-lg"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            <CreateSessionDialog />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
              {filterButtons.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setFilter(btn.key)}
                  className={`group rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                    filter === btn.key
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-border hover:border-accent hover:bg-accent/50'
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {btn.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold">{btn.count}</p>
                </button>
              ))}
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
                className="pl-10"
              />
            </div>
          </div>

          {/* Sessions Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block">
                  <RefreshCw className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
                </div>
                <p className="text-muted-foreground">Carregando sessões...</p>
              </div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
                <Smartphone className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                {search || filter !== 'all' ? 'Nenhuma sessão encontrada' : 'Nenhuma sessão criada'}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground max-w-sm mx-auto">
                {search || filter !== 'all'
                  ? 'Tente ajustar sua busca ou filtro'
                  : 'Crie sua primeira sessão para começar a gerenciar suas instâncias do WhatsApp'}
              </p>
              {!search && filter === 'all' && <CreateSessionDialog />}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSessions.map((session) => (
                <SessionCard 
                  key={session.id} 
                  session={session}
                  onDelete={(id) => setSessions(sessions.filter(s => s.id !== id))}
                  onRefresh={fetchSessions}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 py-4 text-center text-sm text-muted-foreground">
        <p>
          OnWapp Panel · WhatsApp Multi-Device API ·{' '}
          <span className="font-medium">
            {sessions.length} {sessions.length === 1 ? 'sessão' : 'sessões'}
          </span>
        </p>
      </footer>
    </div>
  );
}