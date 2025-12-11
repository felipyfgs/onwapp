"use client";

import { Webhook } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Webhook as WebhookIcon, CheckCircle, XCircle, ExternalLink, Trash2 } from "lucide-react";

interface WebhookCardProps {
  webhook: Webhook;
  onEdit?: () => void;
  onDelete?: () => void;
}

const defaultEvents = [
  "message.received",
  "message.sent",
  "message.receipt",
  "message.reaction",
  "session.connected",
  "session.disconnected",
  "session.qr",
  "presence.update",
  "group.update",
  "contact.update",
];

export function WebhookCard({ webhook, onEdit, onDelete }: WebhookCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <WebhookIcon className="h-5 w-5" />
              Webhook Configuration
            </CardTitle>
            <CardDescription>Events will be sent to this URL</CardDescription>
          </div>
          <Badge variant={webhook.enabled !== false ? "default" : "secondary"}>
            {webhook.enabled !== false ? (
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
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <code className="flex-1 text-sm truncate">{webhook.url}</code>
          <a href={webhook.url} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Events</p>
          <div className="flex flex-wrap gap-2">
            {(webhook.events || defaultEvents).map((event) => (
              <Badge key={event} variant="outline">
                {event}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              Edit Webhook
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
