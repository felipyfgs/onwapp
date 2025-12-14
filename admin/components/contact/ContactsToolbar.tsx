"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Phone, RefreshCw, Ban, QrCode } from "lucide-react";

interface ContactsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onCheckPhoneClick: () => void;
  onBlocklistClick: () => void;
  onQRClick: () => void;
  disabled?: boolean;
}

export function ContactsToolbar({
  searchQuery,
  onSearchChange,
  onRefresh,
  onCheckPhoneClick,
  onBlocklistClick,
  onQRClick,
  disabled = false,
}: ContactsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar contatos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button variant="outline" size="sm" onClick={onCheckPhoneClick}>
        <Phone className="mr-2 h-4 w-4" />
        Check
      </Button>
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh
      </Button>
      <Button variant="outline" size="sm" onClick={onBlocklistClick} disabled={disabled}>
        <Ban className="mr-2 h-4 w-4" />
        Blocklist
      </Button>
      <Button variant="outline" size="sm" onClick={onQRClick}>
        <QrCode className="mr-2 h-4 w-4" />
        Meu QR
      </Button>
    </div>
  );
}
