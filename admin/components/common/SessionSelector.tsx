"use client";

import { Session } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SessionSelectorProps {
  sessions: Session[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  filterConnected?: boolean;
}

export function SessionSelector({
  sessions,
  value,
  onChange,
  placeholder = "Select session",
  className = "w-full sm:w-[200px]",
  filterConnected = false,
}: SessionSelectorProps) {
  const filteredSessions = filterConnected
    ? sessions.filter((s) => s.status === "connected")
    : sessions;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filteredSessions.map((s) => (
          <SelectItem key={s.session} value={s.session}>
            {s.pushName || s.session}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
