'use client';

import { ChatwootConfig } from "@/components/integration/chatwoot-config";

export default function ChatwootPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div>
        <h2 className="text-2xl font-bold">Chatwoot</h2>
        <p className="text-muted-foreground">Integre sua sessão com o Chatwoot</p>
      </div>
      <ChatwootConfig />
    </div>
  );
}
