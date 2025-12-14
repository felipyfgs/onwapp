/**
 * Centralized date/time formatting utilities
 * Replaces duplicated formatTime functions across components
 */

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Format relative time for chat list (compact format)
 * Returns: "Agora", "5m", "2h", "3d", or "DD/MM"
 */
export function formatRelativeTimeCompact(timestamp?: string | number): string {
  if (!timestamp) return "";

  const date = typeof timestamp === "number"
    ? new Date(timestamp * 1000)
    : new Date(timestamp);

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/**
 * Format time for chat cards (descriptive format)
 * Returns: "HH:MM" if today, "Yesterday", weekday if < 7 days, or "MMM DD"
 */
export function formatChatTime(timestamp?: string | number): string {
  if (!timestamp) return "";

  const date = typeof timestamp === "number"
    ? new Date(timestamp * 1000)
    : new Date(timestamp);

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (days === 1) return "Ontem";
  if (days < 7) {
    return date.toLocaleDateString("pt-BR", { weekday: "short" });
  }
  return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
}

/**
 * Format message time (simple HH:MM format)
 */
export function formatMessageTime(timestamp: string | number): string {
  const date = typeof timestamp === "number"
    ? new Date(timestamp * 1000)
    : new Date(timestamp);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format full date
 */
export function formatFullDate(timestamp: string | number): string {
  const date = typeof timestamp === "number"
    ? new Date(timestamp * 1000)
    : new Date(timestamp);

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format date and time
 */
export function formatDateTime(timestamp: string | number): string {
  const date = typeof timestamp === "number"
    ? new Date(timestamp * 1000)
    : new Date(timestamp);

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
