'use client';

import { useParams } from 'next/navigation';
import { QRDisplay } from "@/components/session/qr-display";
import { ConnectionStatus } from "@/components/session/connection-status";
import { SessionActions } from "@/components/session/session-actions";

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <QRDisplay />
        </div>
        <div className="flex flex-col gap-4">
          <ConnectionStatus />
          <SessionActions />
        </div>
      </div>
    </div>
  );
}
