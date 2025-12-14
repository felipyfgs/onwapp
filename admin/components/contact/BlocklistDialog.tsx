"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";

interface BlocklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocklist: string[];
  loading: boolean;
  blockPhone: string;
  onBlockPhoneChange: (value: string) => void;
  onBlock: () => void;
  onUnblock: (jid: string) => void;
  onFetchBlocklist: () => void;
}

export function BlocklistDialog({
  open,
  onOpenChange,
  blocklist,
  loading,
  blockPhone,
  onBlockPhoneChange,
  onBlock,
  onUnblock,
  onFetchBlocklist,
}: BlocklistDialogProps) {
  useEffect(() => {
    if (open) {
      onFetchBlocklist();
    }
  }, [open, onFetchBlocklist]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Blocked Contacts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Phone number to block..."
              value={blockPhone}
              onChange={(e) => onBlockPhoneChange(e.target.value)}
            />
            <Button onClick={onBlock} disabled={!blockPhone}>
              Block
            </Button>
          </div>
          <Separator />
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : blocklist.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No blocked contacts</div>
            ) : (
              <div className="space-y-2">
                {blocklist.map((jid) => (
                  <div key={jid} className="flex items-center justify-between p-2 border rounded-md">
                    <span className="text-sm font-mono">{jid.split("@")[0]}</span>
                    <Button variant="ghost" size="icon" onClick={() => onUnblock(jid)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
