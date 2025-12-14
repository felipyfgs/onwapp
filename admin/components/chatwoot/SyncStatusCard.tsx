"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChatwootSyncStatus } from "@/lib/api";
import { Play, Check } from "lucide-react";

interface SyncStatusCardProps {
  syncStatus: ChatwootSyncStatus | null;
  onSync: () => void;
  onResolveAll: () => void;
}

export function SyncStatusCard({
  syncStatus,
  onSync,
  onResolveAll,
}: SyncStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sync Status</CardTitle>
          <Badge
            variant={
              syncStatus?.status === "completed" ? "default" : "secondary"
            }
          >
            {syncStatus?.status || "Unknown"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncStatus && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contacts Synced</span>
              <span>{syncStatus.contactsSynced}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Messages Synced</span>
              <span>{syncStatus.messagesSynced}</span>
            </div>
            {syncStatus.lastSyncAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Sync</span>
                <span>{new Date(syncStatus.lastSyncAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <Button onClick={onSync} className="flex-1">
            <Play className="mr-2 h-4 w-4" />
            Sync Now
          </Button>
          <Button variant="outline" onClick={onResolveAll}>
            <Check className="mr-2 h-4 w-4" />
            Resolve All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
