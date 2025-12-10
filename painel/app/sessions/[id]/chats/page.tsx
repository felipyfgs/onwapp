"use client"

import { MessageSquare } from "lucide-react"
import { ChatSidebar } from "@/components/chats"
import { useChatsContext } from "@/lib/contexts/chats-context"

export default function ChatsPage() {
  const { sessionId, chats, loading, highlightChatId } = useChatsContext()

  return (
    <>
      {/* Desktop: Empty state (sidebar is in layout) */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-background">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-medium text-foreground mb-1">OnWapp Web</h2>
        <p className="text-sm text-muted-foreground">Selecione uma conversa</p>
      </div>

      {/* Mobile: Show chat list */}
      <div className="flex flex-1 md:hidden min-h-0">
        <ChatSidebar
          chats={chats}
          selectedChat={null}
          sessionId={sessionId}
          loading={loading}
          highlightChatId={highlightChatId}
        />
      </div>
    </>
  )
}
