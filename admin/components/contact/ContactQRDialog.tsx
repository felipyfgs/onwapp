"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QrCode, Copy } from "lucide-react";
import { toast } from "sonner";

interface ContactQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrLink: string;
  loading: boolean;
  onFetchQRLink: () => void;
}

export function ContactQRDialog({
  open,
  onOpenChange,
  qrLink,
  loading,
  onFetchQRLink,
}: ContactQRDialogProps) {
  useEffect(() => {
    if (open && !qrLink) {
      onFetchQRLink();
    }
  }, [open, qrLink, onFetchQRLink]);

  const handleCopy = () => {
    navigator.clipboard.writeText(qrLink);
    toast.success("Link copied");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>My Contact QR</DialogTitle>
        </DialogHeader>
        <div className="py-6 flex flex-col items-center gap-4">
          {loading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : (
            <>
              <div className="p-4 bg-white rounded-lg">
                <QrCode className="h-32 w-32 text-black" />
              </div>
              <p className="text-sm text-center text-muted-foreground break-all px-4">
                {qrLink}
              </p>
              <Button variant="secondary" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
