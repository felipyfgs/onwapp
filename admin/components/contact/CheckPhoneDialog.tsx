"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle } from "lucide-react";

interface CheckPhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheck: (phone: string) => void;
  result: { exists: boolean; jid: string } | null;
  checking: boolean;
  onResultClear: () => void;
}

export function CheckPhoneDialog({
  open,
  onOpenChange,
  onCheck,
  result,
  checking,
  onResultClear,
}: CheckPhoneDialogProps) {
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!open) {
      setPhone("");
      onResultClear();
    }
  }, [open, onResultClear]);

  const handleCheck = () => {
    if (phone) {
      onCheck(phone);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check WhatsApp Number</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="Phone number (e.g., 5511999999999)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button onClick={handleCheck} disabled={checking || !phone} className="w-full">
            {checking ? "Checking..." : "Check"}
          </Button>
          {result && (
            <div
              className={`flex items-center gap-2 p-4 rounded-lg ${
                result.exists ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
              }`}
            >
              {result.exists ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <div>
                <p className="font-medium">
                  {result.exists ? "Number has WhatsApp" : "Number not on WhatsApp"}
                </p>
                {result.exists && <p className="text-sm opacity-80">JID: {result.jid}</p>}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
