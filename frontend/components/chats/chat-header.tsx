"use client"

import { Button } from "@/components/ui/button"

export function ChatHeader() {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Chats</h2>
      <Button>New Chat</Button>
    </div>
  )
}