"use client";

import { useEffect, useState, useRef } from "react";
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
import { useSessionConnection } from "@/hooks/useSessionConnection";
import { useSessionForm } from "@/hooks/useSessionForm";
import { useApiKeys } from "@/hooks/useApiKeys";
import { Loader2, Check, Copy, Phone } from "lucide-react";

interface QRCodeModalProps {
  sessionName: string | null;
  open: boolean;
  onClose: () => void;
}

export function QRCodeModal({ sessionName, open, onClose }: QRCodeModalProps) {
  // State for phone input (kept in component as it's UI state)
  const [phone, setPhone] = useState<string>("");

  // Ref to track if we've already initialized this modal instance
  const initializedRef = useRef<boolean>(false);

  // Use hooks for all business logic
  const {
    qrCode,
    qrStatus,
    phoneCode,
    phoneStatus,
    errorMessage,
    actions: connectionActions,
  } = useSessionConnection(sessionName || "");

  const { formatting, validation } = useSessionForm();
  const { isCopied, actions: keyActions } = useApiKeys();

  // Reset and fetch QR when modal opens - optimized dependencies
  useEffect(() => {
    if (open && sessionName) {
      if (!initializedRef.current) {
        console.log("[QR Modal] Modal opened, initializing QR fetch for session:", sessionName);
        initializedRef.current = true;
        connectionActions.reset();
        // Small delay to ensure reset completes before fetching
        const timer = setTimeout(() => {
          connectionActions.fetchQR();
        }, 100);
        // Reset phone input when modal opens
        setPhone("");
        return () => clearTimeout(timer);
      }
    } else if (!open) {
      // Reset initialization flag when modal closes
      initializedRef.current = false;
    }
  }, [open, sessionName]); // Remove connectionActions from deps

  // Auto-close when connected
  useEffect(() => {
    if (phoneStatus === 'connected' || qrStatus === 'connected') {
      console.log("Session connected, closing modal...");
      onClose();
    }
  }, [phoneStatus, qrStatus, onClose]);

  const handleGenerateCode = async () => {
    if (!phone) return;

    try {
      await connectionActions.generatePhoneCode(phone);
    } catch (error) {
      // Error handling is done in the hook
      console.error("Failed to generate pair code:", error);
    }
  };

  const handleCopyCode = async () => {
    if (phoneCode) {
      await keyActions.copyToClipboard(phoneCode);
    }
  };

  const handleTryAgain = () => {
    connectionActions.reset();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanedPhone = formatting.cleanPhoneNumber(e.target.value);
    setPhone(cleanedPhone);
  };

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
              {qrStatus === 'loading' || (qrStatus === 'connecting' && !qrCode) ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {qrStatus === 'loading' ? 'Loading QR Code...' : 'Generating QR Code...'}
                  </p>
                  <p className="text-xs text-muted-foreground/60">This may take a few seconds</p>
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
                    {qrStatus === "idle"
                      ? "Click Connect to generate QR code"
                      : `Status: ${qrStatus}`}
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
                  onChange={handlePhoneChange}
                />
                <p className="text-sm text-muted-foreground">
                  Include country code without + or spaces
                </p>
              </div>

              {/* Generate Code Button */}
              <Button
                onClick={handleGenerateCode}
                disabled={!phone || phoneStatus === "loading"}
                className="w-full"
              >
                {phoneStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Code
              </Button>

              {/* Code Display Section */}
              {phoneCode && (phoneStatus === "code_generated" || phoneStatus === "connected") && (
                <div className="text-center p-6 bg-muted rounded-lg">
                  <div className="text-3xl font-mono tracking-wider">{phoneCode}</div>
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
                    {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {isCopied ? "Copied!" : "Copy Code"}
                  </Button>
                  {phoneStatus === "connected" && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-green-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Connecting to WhatsApp...</span>
                    </div>
                  )}
                </div>
              )}

              {phoneStatus === "error" && (
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-red-700 text-sm">{errorMessage}</p>
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
