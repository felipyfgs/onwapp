"use client";

import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common";
import { useChatwoot } from "@/hooks/chatwoot/useChatwoot";
import {
  ChatwootStats,
  ChatwootSetupCard,
  ChatwootConfigDialog,
  SyncStatusCard,
  ConfigurationCard,
} from "@/components/chatwoot";
import { RefreshCw } from "lucide-react";

export default function ChatwootPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const {
    config,
    syncStatus,
    overview,
    stats,
    loading,
    form,
    setFormField,
    configDialogOpen,
    setConfigDialogOpen,
    validating,
    saving,
    refresh,
    validateCredentials,
    saveConfig,
    sync,
    resolveAll,
    reset,
    deleteConfig,
  } = useChatwoot(sessionId);

  const handleResolveAll = async () => {
    if (!confirm("Resolve all conversations?")) return;
    await resolveAll();
  };

  const handleReset = async () => {
    if (!confirm("Reset Chatwoot integration?")) return;
    await reset();
  };

  const handleDelete = async () => {
    if (!confirm("Delete Chatwoot configuration?")) return;
    await deleteConfig();
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader
          breadcrumbs={[
            { label: "Sessions", href: "/sessions" },
            { label: sessionId, href: `/sessions/${sessionId}` },
            { label: "Chatwoot" },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex gap-4">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>

          {!config ? (
            <ChatwootSetupCard onSetup={() => setConfigDialogOpen(true)} />
          ) : (
            <>
              <ChatwootStats
                overview={overview}
                stats={stats}
                loading={loading}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <SyncStatusCard
                  syncStatus={syncStatus}
                  onSync={sync}
                  onResolveAll={handleResolveAll}
                />

                <ConfigurationCard
                  config={config}
                  onEdit={() => setConfigDialogOpen(true)}
                  onReset={handleReset}
                  onDelete={handleDelete}
                />
              </div>
            </>
          )}

          <ChatwootConfigDialog
            open={configDialogOpen}
            onOpenChange={setConfigDialogOpen}
            form={form}
            onFormChange={setFormField}
            onValidate={validateCredentials}
            onSave={saveConfig}
            validating={validating}
            saving={saving}
            showValidateButton={!config}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
