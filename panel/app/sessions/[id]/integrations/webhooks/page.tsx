'use client';

import { WebhookManager } from "@/components/integration/webhook-manager";

export default function WebhooksPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h2 className="text-2xl font-bold">Webhooks</h2>
        <p className="text-muted-foreground">Configure webhooks para receber eventos em tempo real</p>
      </div>
      <WebhookManager />
    </div>
  );
}
