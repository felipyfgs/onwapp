import { useState, useEffect } from "react";
import { getSessions, type Session } from "@/lib/api";

export function useChatSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");

  useEffect(() => {
    getSessions().then((data) => {
      const connected = Array.isArray(data)
        ? data.filter((s) => s.status === "connected")
        : [];
      setSessions(connected);
      if (connected.length > 0) {
        setSelectedSession(connected[0].session);
      }
    });
  }, []);

  return {
    sessions,
    selectedSession,
    setSelectedSession,
  };
}
