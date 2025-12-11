"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getQR } from "@/lib/api";
import { useSessionEvent } from "@/hooks/useSessionEvents";
import { SessionEvent } from "@/lib/nats";
import { Loader2 } from "lucide-react";

interface QRCodeModalProps {
  sessionName: string | null;
  open: boolean;
  onClose: () => void;
}

export function QRCodeModal({ sessionName, open, onClose }: QRCodeModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("loading");
  const [loading, setLoading] = useState(false);

  const fetchQR = useCallback(async () => {
    if (!sessionName) return;

    setLoading(true);
    try {
      const response = await getQR(sessionName);
      if (response.qr) {
        setQrCode(response.qr);
      }
      setStatus(response.status);
    } catch (error) {
      console.error("Failed to fetch QR:", error);
    } finally {
      setLoading(false);
    }
  }, [sessionName]);

  useEffect(() => {
    if (open && sessionName) {
      fetchQR();
    }
  }, [open, sessionName, fetchQR]);

  const handleEvent = useCallback(
    (event: SessionEvent) => {
      if (event.event === "session.qr" && event.data?.qrBase64) {
        setQrCode(event.data.qrBase64);
        setStatus("connecting");
      } else if (event.event === "session.connected") {
        setStatus("connected");
        setTimeout(onClose, 1000);
      } else if (event.event === "session.disconnected") {
        setStatus("disconnected");
      }
    },
    [onClose]
  );

  useSessionEvent(sessionName, handleEvent);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {sessionName ? `Connect: ${sessionName}` : "QR Code"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading QR Code...</p>
            </div>
          ) : status === "connected" ? (
            <div className="flex flex-col items-center gap-2 text-green-600">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="font-medium">Connected!</p>
            </div>
          ) : qrCode ? (
            <div className="flex flex-col items-center gap-4">
              <img
                src={qrCode}
                alt="QR Code"
                className="h-64 w-64 rounded-lg border"
              />
              <p className="text-sm text-muted-foreground">
                Scan with WhatsApp to connect
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <p>No QR code available</p>
              <p className="text-xs">
                {status === "disconnected"
                  ? "Click Connect to generate QR code"
                  : `Status: ${status}`}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
