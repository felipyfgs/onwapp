"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getQR, pairPhone, connectSession } from "@/lib/api";
import { useSessionEvent } from "@/hooks/useSessionEvents";
import { SessionEvent } from "@/lib/nats";
import { Loader2, Check, Copy, Phone } from "lucide-react";

interface QRCodeModalProps {
  sessionName: string | null;
  open: boolean;
  onClose: () => void;
}

export function QRCodeModal({ sessionName, open, onClose }: QRCodeModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("loading");
  const [loading, setLoading] = useState(false);

  // States for Phone Code tab
  const [phone, setPhone] = useState<string>("");
  const [pairCode, setPairCode] = useState<string>("");
  const [pairStatus, setPairStatus] = useState<"idle" | "loading" | "code_generated" | "connecting" | "connected" | "error">("idle");
  const [pairError, setPairError] = useState<string>("");

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

  const handleGenerateCode = useCallback(async () => {
    if (!sessionName || !phone) return;

    setPairStatus("loading");
    setPairError("");

    try {
      // First, ensure session is connected/initialized
      await connectSession(sessionName);

      // Small delay to ensure connection is established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clean phone number - remove non-digits
      const cleanPhone = phone.replace(/\D/g, "");
      const response = await pairPhone(sessionName, cleanPhone);
      setPairCode(response.code);
      setPairStatus("code_generated");
    } catch (error: any) {
      console.error("Failed to generate pair code:", error);
      const errorMessage = error?.message || "Failed to generate code";

      // Provide more user-friendly error messages
      if (errorMessage.includes("websocket not connected")) {
        setPairError("Failed to initialize WhatsApp connection. Please try again.");
      } else if (errorMessage.includes("session not found")) {
        setPairError("Session not found. Please check session name and try again.");
      } else {
        setPairError("Failed to generate code. Please try again.");
      }

      setPairStatus("error");
    }
  }, [sessionName, phone]);

  const handleCopyCode = () => {
    if (pairCode) {
      navigator.clipboard.writeText(pairCode);
    }
  };

  const handleTryAgain = () => {
    setPairStatus("idle");
    setPairCode("");
    setPairError("");
  };

  useEffect(() => {
    if (open && sessionName) {
      fetchQR();
      // Reset phone code states when modal opens
      setPairStatus("idle");
      setPhone("");
      setPairCode("");
      setPairError("");
    }
  }, [open, sessionName, fetchQR]);

  const handleEvent = useCallback(
    (event: SessionEvent) => {
      if (event.event === "session.qr" && event.data?.qrBase64) {
        setQrCode(event.data.qrBase64);
        setStatus("connecting");
      } else if (event.event === "session.connected") {
        setStatus("connected");
        setPairStatus("connected");
        setTimeout(onClose, 1000);
      } else if (event.event === "session.disconnected") {
        setStatus("disconnected");
        setPairStatus("idle");
      }
    },
    [onClose]
  );

  useSessionEvent(sessionName, handleEvent);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {sessionName ? `Connect: ${sessionName}` : "QR Code"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="qr" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr" className="flex items-center gap-2">
              QR Code
            </TabsTrigger>
            <TabsTrigger value="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="mt-6">
            <div className="flex flex-col items-center justify-center py-4">
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
          </TabsContent>

          <TabsContent value="phone" className="mt-6">
            <div className="space-y-4">
              {/* Phone Input Section */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="5511999999999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                />
                <p className="text-sm text-muted-foreground">
                  Include country code without + or spaces
                </p>
              </div>

              {/* Generate Code Button */}
              <Button
                onClick={handleGenerateCode}
                disabled={!phone || pairStatus === "loading"}
                className="w-full"
              >
                {pairStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Code
              </Button>

              {/* Code Display Section */}
              {pairCode && pairStatus === "code_generated" && (
                <div className="text-center p-6 bg-muted rounded-lg">
                  <div className="text-3xl font-mono tracking-wider">{pairCode}</div>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p>1. Open WhatsApp</p>
                    <p>2. Go to Linked Devices</p>
                    <p>3. Select "Link with phone number"</p>
                    <p>4. Enter the code above</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleCopyCode}
                  >
                    Copy Code
                  </Button>
                </div>
              )}

              {/* Status Section */}
              {pairStatus === "connected" && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Connected Successfully!</p>
                </div>
              )}

              {pairStatus === "error" && (
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-red-700 text-sm">{pairError}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleTryAgain}>
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
