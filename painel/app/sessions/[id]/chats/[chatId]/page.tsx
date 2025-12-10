"use client"

import { use, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChatSidebar, ChatView, ChatViewRef } from "@/components/chats"
import { useChatsContext } from "@/lib/contexts/chats-context"
import { reconstructJid } from "@/lib/utils/jid"

interface ChatPageProps {
  params: Promise<{ id: string; chatId: string }>
}

export default function ChatPage({ params }: ChatPageProps) {
  const { chatId } = use(params)
  const router = useRouter()
  const jid = reconstructJid(chatId)
  const chatViewRef = useRef<ChatViewRef>(null)

  const { sessionId, chats, loading, highlightChatId, newMessage, statusUpdate } = useChatsContext()

  const chat = chats.find((c) => c.jid === jid) || null

  // Handle status updates from WebSocket
  useEffect(() => {
    if (statusUpdate && chatViewRef.current) {
      chatViewRef.current.updateMessageStatus(statusUpdate.messageIds, statusUpdate.status)
    }
  }, [statusUpdate])

  const handleBack = () => {
    router.push(`/sessions/${sessionId}/chats`)
  }

  // Desktop: Only show ChatView (sidebar is in layout)
  // Mobile: Show ChatView with back button
  return (
    <>
      {/* Desktop: ChatView only */}
      <div className="hidden md:flex flex-1 flex-col min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : chat ? (
          <ChatView
            ref={chatViewRef}
            chat={chat}
            sessionId={sessionId}
            newMessage={newMessage?.chatJid === jid ? newMessage : null}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-muted-foreground">Chat não encontrado</p>
          </div>
        )}
      </div>

      {/* Mobile: ChatView with back, or list if no chat */}
      <div className="flex flex-1 md:hidden min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : chat ? (
          <ChatView
            ref={chatViewRef}
            chat={chat}
            sessionId={sessionId}
            newMessage={newMessage?.chatJid === jid ? newMessage : null}
            onBack={handleBack}
          />
        ) : (
          <ChatSidebar
            chats={chats}
            selectedChat={null}
            sessionId={sessionId}
            loading={loading}
            highlightChatId={highlightChatId}
          />
        )}
      </div>
    </>
  )
}
