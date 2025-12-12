"use client";

import { useEffect, useState, useCallback } from "react";
import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, StatsCard } from "@/components/common";
import {
  getSessions,
  getChatwootConfig,
  setChatwootConfig,
  deleteChatwootConfig,
  syncChatwoot,
  getChatwootSyncStatus,
  getChatwootOverview,
  getChatwootConversationStats,
  resolveAllChatwootConversations,
  resetChatwoot,
  validateChatwootCredentials,
  Session,
  ChatwootConfig,
  ChatwootSyncStatus,
  ChatwootOverview,
  ChatwootStats,
} from "@/lib/api";
import {
  MessageSquare,
  Users,
  RefreshCw,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  Play,
  AlertCircle,
  Check,
} from "lucide-react";

export default function ChatwootPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [config, setConfig] = useState<ChatwootConfig | null>(null);
  const [syncStatus, setSyncStatus] = useState<ChatwootSyncStatus | null>(null);
  const [overview, setOverview] = useState<ChatwootOverview | null>(null);
  const [stats, setStats] = useState<ChatwootStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [configDialog, setConfigDialog] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [inboxId, setInboxId] = useState("");
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSessions()
      .then((data) => {
        const connected = Array.isArray(data) ? data.filter((s) => s.status === "connected") : [];
        setSessions(connected);
        if (connected.length > 0) {
          setSelectedSession(connected[0].session);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const [configData, statusData, overviewData, statsData] = await Promise.all([
        getChatwootConfig(selectedSession),
        getChatwootSyncStatus(selectedSession).catch(() => null),
        getChatwootOverview(selectedSession).catch(() => null),
        getChatwootConversationStats(selectedSession).catch(() => null),
      ]);
      setConfig(configData);
      setSyncStatus(statusData);
      setOverview(overviewData);
      setStats(statsData);
      if (configData) {
        setBaseUrl(configData.baseUrl);
        setApiToken(configData.apiAccessToken);
        setAccountId(String(configData.accountId));
        setInboxId(String(configData.inboxId));
      }
    } catch (error) {
      console.error("Failed to fetch Chatwoot data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedSession) {
      fetchData();
    }
  }, [selectedSession, fetchData]);

  const handleValidate = async () => {
    if (!baseUrl || !apiToken) return;
    setValidating(true);
    try {
      const result = await validateChatwootCredentials(baseUrl, apiToken);
      if (result.valid && result.account) {
        setAccountId(String(result.account.id));
        alert(`Credentials valid! Account: ${result.account.name}`);
      } else {
        alert("Invalid credentials");
      }
    } catch {
      alert("Failed to validate credentials");
    } finally {
      setValidating(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedSession || !baseUrl || !apiToken || !accountId || !inboxId) return;
    setSaving(true);
    try {
      await setChatwootConfig(selectedSession, {
        baseUrl,
        apiAccessToken: apiToken,
        accountId: parseInt(accountId),
        inboxId: parseInt(inboxId),
      });
      setConfigDialog(false);
      fetchData();
    } catch {
      alert("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!selectedSession) return;
    try {
      await syncChatwoot(selectedSession);
      fetchData();
    } catch {
      alert("Failed to start sync");
    }
  };

  const handleResolveAll = async () => {
    if (!selectedSession || !confirm("Resolve all conversations?")) return;
    try {
      const result = await resolveAllChatwootConversations(selectedSession);
      alert(`Resolved ${result.resolved} conversations`);
      fetchData();
    } catch {
      alert("Failed to resolve conversations");
    }
  };

  const handleReset = async () => {
    if (!selectedSession || !confirm("Reset Chatwoot integration?")) return;
    try {
      await resetChatwoot(selectedSession);
      fetchData();
    } catch {
      alert("Failed to reset");
    }
  };

  const handleDelete = async () => {
    if (!selectedSession || !confirm("Delete Chatwoot configuration?")) return;
    try {
      await deleteChatwootConfig(selectedSession);
      setConfig(null);
      setSyncStatus(null);
      setOverview(null);
      setStats(null);
    } catch {
      alert("Failed to delete configuration");
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader breadcrumbs={[{ label: "Integrations" }, { label: "Chatwoot" }]} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Toolbar */}
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
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {!selectedSession ? (
            <div className="rounded-xl border bg-muted/50 p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Select a session</h3>
              <p className="text-muted-foreground">Choose a session to configure Chatwoot</p>
            </div>
          ) : !config ? (
            <Card>
              <CardHeader>
                <CardTitle>Configure Chatwoot</CardTitle>
                <CardDescription>Connect this session to your Chatwoot inbox</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={configDialog} onOpenChange={setConfigDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Settings className="mr-2 h-4 w-4" />
                      Setup Integration
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Chatwoot Configuration</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Chatwoot URL</Label>
                        <Input placeholder="https://app.chatwoot.com" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>API Access Token</Label>
                        <Input type="password" placeholder="Your API token" value={apiToken} onChange={(e) => setApiToken(e.target.value)} />
                      </div>
                      <Button variant="outline" onClick={handleValidate} disabled={validating} className="w-full">
                        {validating ? "Validating..." : "Validate Credentials"}
                      </Button>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Account ID</Label>
                          <Input placeholder="1" value={accountId} onChange={(e) => setAccountId(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Inbox ID</Label>
                          <Input placeholder="1" value={inboxId} onChange={(e) => setInboxId(e.target.value)} />
                        </div>
                      </div>
                      <Button onClick={handleSaveConfig} disabled={saving} className="w-full">
                        {saving ? "Saving..." : "Save Configuration"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <StatsCard title="Contacts" value={overview?.contactsCount || 0} icon={Users} variant="chart1" />
                <StatsCard title="Conversations" value={overview?.conversationsCount || 0} icon={MessageSquare} variant="chart2" />
                <StatsCard title="Open" value={stats?.open || 0} icon={AlertCircle} variant="chart4" />
                <StatsCard title="Resolved" value={stats?.resolved || 0} icon={CheckCircle} variant="primary" />
              </div>

              {/* Status & Config */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Sync Status</CardTitle>
                      <Badge variant={syncStatus?.status === "completed" ? "default" : "secondary"}>
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
                      <Button onClick={handleSync} className="flex-1">
                        <Play className="mr-2 h-4 w-4" />
                        Sync Now
                      </Button>
                      <Button variant="outline" onClick={handleResolveAll}>
                        <Check className="mr-2 h-4 w-4" />
                        Resolve All
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Configuration</CardTitle>
                      <Badge variant={config.enabled ? "default" : "secondary"}>
                        {config.enabled ? <><CheckCircle className="h-3 w-3 mr-1" />Active</> : <><XCircle className="h-3 w-3 mr-1" />Disabled</>}
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
                      <Dialog open={configDialog} onOpenChange={setConfigDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1">
                            <Settings className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Chatwoot Configuration</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Chatwoot URL</Label>
                              <Input placeholder="https://app.chatwoot.com" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>API Access Token</Label>
                              <Input type="password" placeholder="Your API token" value={apiToken} onChange={(e) => setApiToken(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Account ID</Label>
                                <Input placeholder="1" value={accountId} onChange={(e) => setAccountId(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label>Inbox ID</Label>
                                <Input placeholder="1" value={inboxId} onChange={(e) => setInboxId(e.target.value)} />
                              </div>
                            </div>
                            <Button onClick={handleSaveConfig} disabled={saving} className="w-full">
                              {saving ? "Saving..." : "Save Configuration"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" onClick={handleReset}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                      <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
