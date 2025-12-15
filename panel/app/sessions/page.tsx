'use client';

import { SessionList } from '@/components/session/session-list';
import { CreateSessionDialog } from '@/components/session/create-session-dialog';

export default function SessionsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">OnWapp Sessions</h1>
          </div>
          <div className="flex items-center gap-4">
            <CreateSessionDialog />
          </div>
        </div>
      </header>

      <main className="container flex-1 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Suas Sessões</h2>
            <p className="text-muted-foreground">
              Gerencie suas sessões e conexões do WhatsApp
            </p>
          </div>
        </div>

        <SessionList />
      </main>
    </div>
  );
}
