'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { useGlobalStore } from '@/stores/global-store';
import { useActiveSessionStore } from '@/stores/active-session-store';
import { ModeToggle } from '@/components/mode-toggle';
import apiClient from '@/lib/api';
import { SessionCard } from '@/components/session/session-card';
import { CreateSessionDialog } from '@/components/session/create-session-dialog';
import { QrCodeDialog } from '@/components/session/qr-code-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Smartphone,
  Menu,
  X,
  Grid,
  List,
  SortAsc,
  SortDesc,
  QrCode
} from 'lucide-react';
import { Session } from '@/lib/types/api';

export default function SessionsPage() {
  const { sessions, loading, setSessions, setLoading } = useSessionStore();
  const natsConnected = useGlobalStore((state) => state.natsConnected);
  const activeSessionId = useActiveSessionStore((state) => state.sessionId);
  
  // State
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'connected' | 'disconnected' | 'connecting'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'lastActivity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrSessionName, setQrSessionName] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState('disconnected');

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/sessions', { timeout: 30000 });
      const data = Array.isArray(response.data) ? response.data : [];
      setSessions(data.filter((session: Session) => session && session.session));
    } catch (error: any) {
      console.error('Failed to fetch sessions:', error);
      setError('Não foi possível carregar as sessões. Verifique se a API está online.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [setSessions, setLoading]);

  // Filter and sort sessions
  const filteredSessions = sessions.filter((session: Session) => {
    if (!session || !session.session) return false;
    const matchesSearch = session.session.toLowerCase().includes(search.toLowerCase()) ||
                          (session.pushName && session.pushName.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'all' || session.status === filter;
    return matchesSearch && matchesFilter;
  }).sort((a: Session, b: Session) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = (a.pushName || a.session).toLowerCase();
        bValue = (b.pushName || b.session).toLowerCase();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'lastActivity':
        aValue = (a as any).lastActivity || 0;
        bValue = (b as any).lastActivity || 0;
        break;
      default:
        aValue = a.session;
        bValue = b.session;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  

  // Stats
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

  const sortOptions = [
    { key: 'name' as const, label: 'Nome' },
    { key: 'status' as const, label: 'Status' },
    { key: 'lastActivity' as const, label: 'Atividade' },
  ];

  // Effects
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const fetchQrCodeForSession = async (sessionName: string) => {
    try {
      setQrSessionName(sessionName);
      setQrStatus('connecting');
      setQrDialogOpen(true);
      
      // First trigger connect if not already connecting
      await apiClient.post(`/sessions/${sessionName}/connect`);
      
      // Then fetch QR code
      const response = await apiClient.get(`/sessions/${sessionName}/qr`);
      
      if (response.data.qr) {
        setQrCode(response.data.qr);
        setQrStatus(response.data.status || 'connecting');
      }
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      setQrStatus('disconnected');
      setSuccessMessage('Falha ao gerar QR code');
    }
  };

  const handleQrDialogClose = () => {
    setQrDialogOpen(false);
    setQrCode(null);
    setQrStatus('disconnected');
    setQrSessionName(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for search focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Buscar sessões"]') as HTMLInputElement;
        searchInput?.focus();
      }
      
      // Ctrl/Cmd + R for refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        fetchSessions();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchSessions]);

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
            
            {/* Keyboard Shortcuts Indicator */}
            <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
              <span className="hidden lg:inline">Atalhos:</span>
              <kbd className="px-1 py-0.5 bg-background border border-border rounded text-[10px]">Ctrl+K</kbd>
              <span className="hidden sm:inline">buscar</span>
              <kbd className="px-1 py-0.5 bg-background border border-border rounded text-[10px]">Ctrl+R</kbd>
              <span className="hidden lg:inline">atualizar</span>
            </div>
            
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 rounded-lg border border-green-200 bg-green-50 p-4 shadow-lg animate-in slide-in-from-top-2 fade-in-0 dark:border-green-800 dark:bg-green-950/50">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        </div>
      )}

      {/* QR Code Dialog */}
      <QrCodeDialog
        sessionName={qrSessionName || ''}
        qrCode={qrCode || undefined}
        status={qrStatus}
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        onClose={handleQrDialogClose}
      />

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
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

          {/* Enhanced Search Bar with Controls */}
          <div className="mb-6 space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar sessões por nome ou sessão ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Sort Controls */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-border rounded-md bg-background text-sm"
                >
                  {sortOptions.map(option => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
                
                <div className="flex border border-border rounded-md">
                  <Button
                    variant={viewMode === 'compact' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('compact')}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('detailed')}
                    className="rounded-l-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={fetchSessions}
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Atualizar</span>
                </Button>

                <CreateSessionDialog />
              </div>
            </div>
          </div>

          {/* Sessions List */}
          {error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20 mb-4">
                <WifiOff className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-destructive">Erro de Conexão</h3>
              <p className="mb-6 text-sm text-muted-foreground max-w-sm mx-auto">
                {error}
              </p>
              <Button onClick={fetchSessions} variant="outline" className="border-destructive/50 hover:bg-destructive/20">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                </div>
                <p className="text-sm text-muted-foreground">Carregando sessões...</p>
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
            <div className="space-y-4">
              
              
              {/* Sessions Grid/List */}
              <div className={viewMode === 'detailed' ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-3 py-2"}>
                {filteredSessions.map((session) => (
                  <SessionCard 
                    key={session.id} 
                    session={session}
                    onDelete={(id) => setSessions(sessions.filter(s => s.id !== id))}
                    onRefresh={fetchSessions}
                    onQRCodeRequest={fetchQrCodeForSession}
                    viewMode={viewMode}
                    isSelected={activeSessionId === session.session}
                  />
                ))}
              </div>
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
