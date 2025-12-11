"use client";

import { useState } from "react";
import { checkPhone } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Phone, CheckCircle, XCircle } from "lucide-react";

interface CheckPhoneDialogProps {
  sessionId: string;
  trigger?: React.ReactNode;
}

export function CheckPhoneDialog({ sessionId, trigger }: CheckPhoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<{ exists: boolean; jid: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    if (!phone || !sessionId) return;
    setChecking(true);
    try {
      const results = await checkPhone(sessionId, [phone]);
      setResult(results[0] || null);
    } catch (error) {
      console.error("Failed to check phone:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setPhone("");
      setResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Phone className="mr-2 h-4 w-4" />
            Check Number
          </Button>
        )}
      </DialogTrigger>
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
            <div className={`flex items-center gap-2 p-4 rounded-lg ${result.exists ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              {result.exists ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <div>
                <p className="font-medium">
                  {result.exists ? "Number has WhatsApp" : "Number not on WhatsApp"}
                </p>
                {result.exists && (
                  <p className="text-sm opacity-80">JID: {result.jid}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
