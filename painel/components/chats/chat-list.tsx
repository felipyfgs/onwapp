"use client"

import { Chat } from "@/lib/api/chats"
import { ChatListItem } from "./chat-list-item"

interface ChatListProps {
  chats: Chat[]
  onChatClick: (chat: Chat) => void
}

export function ChatList({ chats, onChatClick }: ChatListProps) {
  return (
    <div className="border border-border rounded-lg divide-y divide-border">
      {chats.map((chat) => (
        <ChatListItem key={chat.jid} chat={chat} onClick={() => onChatClick(chat)} />
      ))}
    </div>
  )
}
