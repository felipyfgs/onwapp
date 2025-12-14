"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChatwootFormState {
  baseUrl: string;
  apiToken: string;
  accountId: string;
  inboxId: string;
}

interface ChatwootConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ChatwootFormState;
  onFormChange: (field: keyof ChatwootFormState, value: string) => void;
  onValidate?: () => void;
  onSave: () => void;
  validating?: boolean;
  saving?: boolean;
  showValidateButton?: boolean;
}

export function ChatwootConfigDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onValidate,
  onSave,
  validating = false,
  saving = false,
  showValidateButton = true,
}: ChatwootConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chatwoot Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Chatwoot URL</Label>
            <Input
              placeholder="https://app.chatwoot.com"
              value={form.baseUrl}
              onChange={(e) => onFormChange("baseUrl", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>API Access Token</Label>
            <Input
              type="password"
              placeholder="Your API token"
              value={form.apiToken}
              onChange={(e) => onFormChange("apiToken", e.target.value)}
            />
          </div>
          {showValidateButton && onValidate && (
            <Button
              variant="outline"
              onClick={onValidate}
              disabled={validating}
              className="w-full"
            >
              {validating ? "Validating..." : "Validate Credentials"}
            </Button>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account ID</Label>
              <Input
                placeholder="1"
                value={form.accountId}
                onChange={(e) => onFormChange("accountId", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Inbox ID</Label>
              <Input
                placeholder="1"
                value={form.inboxId}
                onChange={(e) => onFormChange("inboxId", e.target.value)}
              />
            </div>
          </div>
          <Button onClick={onSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
