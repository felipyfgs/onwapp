"use client";

import { useEffect, useState, useCallback } from "react";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getSessions, getWebhook, setWebhook, deleteWebhook, Webhook, Session } from "@/lib/api";
import { Webhook as WebhookIcon, Plus, Trash2, RefreshCw, CheckCircle, XCircle, ExternalLink } from "lucide-react";

export default function WebhooksPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [webhook, setWebhookState] = useState<Webhook | null>(null);
  const [loading, setLoading] = useState(true);
  const [configDialog, setConfigDialog] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSessions()
      .then((data) => {
        const connected = data.filter((s) => s.status === "connected");
        setSessions(connected);
        if (connected.length > 0) {
          setSelectedSession(connected[0].session);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchWebhook = useCallback(async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const data = await getWebhook(selectedSession);
      setWebhookState(data);
      if (data) {
        setWebhookUrl(data.url);
      }
    } catch (error) {
      console.error("Failed to fetch webhook:", error);
      setWebhookState(null);
    } finally {
      setLoading(false);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedSession) {
      fetchWebhook();
    }
  }, [selectedSession, fetchWebhook]);

  const handleSaveWebhook = async () => {
    if (!webhookUrl || !selectedSession) return;
    setSaving(true);
    try {
      const result = await setWebhook(selectedSession, { url: webhookUrl, enabled: true });
      setWebhookState(result);
      setConfigDialog(false);
    } catch (error) {
      console.error("Failed to save webhook:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!selectedSession || !confirm("Delete this webhook?")) return;
    try {
      await deleteWebhook(selectedSession);
      setWebhookState(null);
      setWebhookUrl("");
    } catch (error) {
      console.error("Failed to delete webhook:", error);
    }
  };

  const allEvents = [
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

  return (
    <PageLayout
      title="Webhooks"
      breadcrumbs={[{ label: "Integrations", href: "/integrations" }, { label: "Webhooks" }]}
      actions={
        <Button variant="outline" size="sm" onClick={fetchWebhook}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Session Selector */}
        <div className="flex gap-4">
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.session} value={s.session}>
                  {s.pushName || s.session}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Webhook Card */}
        {!selectedSession ? (
          <div className="rounded-xl border bg-muted/50 p-12 text-center">
            <WebhookIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Select a session</h3>
            <p className="text-muted-foreground">Choose a session to configure webhooks</p>
          </div>
        ) : loading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ) : webhook ? (
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
                <Label className="text-sm text-muted-foreground">Events</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(webhook.events || allEvents).map((event) => (
                    <Badge key={event} variant="outline">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Dialog open={configDialog} onOpenChange={setConfigDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Edit Webhook</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configure Webhook</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Webhook URL</Label>
                        <Input
                          placeholder="https://your-server.com/webhook"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleSaveWebhook} disabled={saving || !webhookUrl} className="w-full">
                        {saving ? "Saving..." : "Save Webhook"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" onClick={handleDeleteWebhook}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Webhook Configured</CardTitle>
              <CardDescription>Set up a webhook to receive real-time events</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={configDialog} onOpenChange={setConfigDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configure Webhook</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <Input
                        placeholder="https://your-server.com/webhook"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSaveWebhook} disabled={saving || !webhookUrl} className="w-full">
                      {saving ? "Saving..." : "Save Webhook"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {/* Events Info */}
        <Card>
          <CardHeader>
            <CardTitle>Available Events</CardTitle>
            <CardDescription>Events that will be sent to your webhook</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {allEvents.map((event) => (
                <div key={event} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Badge variant="outline" className="font-mono text-xs">
                    {event}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
