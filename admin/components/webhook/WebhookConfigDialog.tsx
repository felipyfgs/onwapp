"use client";

import { useState, useEffect } from "react";
import { setWebhook } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WebhookConfigDialogProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl?: string;
  onSaved?: () => void;
}

export function WebhookConfigDialog({
  sessionId,
  open,
  onOpenChange,
  initialUrl = "",
  onSaved,
}: WebhookConfigDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  const handleSave = async () => {
    if (!url || !sessionId) return;
    setSaving(true);
    try {
      await setWebhook(sessionId, { url, enabled: true });
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error("Failed to save webhook:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Webhook</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input
              placeholder="https://your-server.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={saving || !url} className="w-full">
            {saving ? "Saving..." : "Save Webhook"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
