"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChatwootConfig } from "@/lib/api";
import { Settings, RefreshCw, Trash2, CheckCircle, XCircle } from "lucide-react";

interface ConfigurationCardProps {
  config: ChatwootConfig;
  onEdit: () => void;
  onReset: () => void;
  onDelete: () => void;
}

export function ConfigurationCard({
  config,
  onEdit,
  onReset,
  onDelete,
}: ConfigurationCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Configuration</CardTitle>
          <Badge variant={config.enabled ? "default" : "secondary"}>
            {config.enabled ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Disabled
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">URL</span>
            <span className="truncate max-w-[200px]">{config.baseUrl}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account ID</span>
            <span>{config.accountId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Inbox ID</span>
            <span>{config.inboxId}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onEdit}>
            <Settings className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
