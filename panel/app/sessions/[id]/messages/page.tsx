'use client';

import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";

export default function MessagesPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="w-80 border-r">
        <ChatSidebar />
      </div>
      <div className="flex-1">
        <ChatWindow />
      </div>
    </div>
  );
}
