"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  RefreshCw,
  Search,
  MessageSquare,
  Image,
  FileAudio,
  FileVideo,
  File,
  MapPin,
  Contact,
  Loader2,
} from "lucide-react"
import { getChats, getChatMessages, Chat, ChatMessage } from "@/lib/api/chats"
import { formatDistanceToNow } from "date-fns"

export function MessageHistory() {
  const sessionId = ""
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchChats()
  }, [sessionId])

  const fetchChats = async () => {
    setLoading(true)
    const res = await getChats(sessionId)
    if (res.success && res.data) {
      setChats(res.data)
    }
    setLoading(false)
  }

  const fetchMessages = async (chat: Chat) => {
    setSelectedChat(chat)
    setMessagesLoading(true)
    const res = await getChatMessages(sessionId, chat.jid, { limit: 50 })
    if (res.success && res.data) {
      setMessages(res.data)
    }
    setMessagesLoading(false)
  }

  const filteredChats = chats.filter(
    (chat) =>
      chat.name?.toLowerCase().includes(search.toLowerCase()) ||
      chat.jid.includes(search)
  )

  const getMessageIcon = (msg: ChatMessage) => {
    switch (msg.mediaType) {
      case "image":
        return <Image className="h-4 w-4" />
      case "audio":
        return <FileAudio className="h-4 w-4" />
      case "video":
        return <FileVideo className="h-4 w-4" />
      case "document":
        return <File className="h-4 w-4" />
      case "location":
        return <MapPin className="h-4 w-4" />
      case "contact":
        return <Contact className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Message History</CardTitle>
            <CardDescription>View recent conversations</CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchChats}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex gap-4 overflow-hidden">
        <div className="w-1/3 flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredChats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No chats found
              </p>
            ) : (
              <div className="space-y-1">
                {filteredChats.slice(0, 20).map((chat) => (
                  <button
                    key={chat.jid}
                    onClick={() => fetchMessages(chat)}
                    className={`w-full text-left p-2 rounded-md hover:bg-muted transition-colors ${
                      selectedChat?.jid === chat.jid ? "bg-muted" : ""
                    }`}
                  >
                    <p className="font-medium text-sm truncate">
                      {chat.name || chat.jid}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.lastMessage || "No messages"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex-1 border rounded-md">
          {selectedChat ? (
            <div className="flex flex-col h-full">
              <div className="p-3 border-b bg-muted/50">
                <p className="font-medium">
                  {selectedChat.name || selectedChat.jid}
                </p>
              </div>
              <ScrollArea className="flex-1 p-3">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No messages
                  </p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.fromMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-2 rounded-lg ${
                            msg.fromMe
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {getMessageIcon(msg)}
                            <Badge variant="outline" className="text-[10px]">
                              {msg.type}
                            </Badge>
                          </div>
                          <p className="text-sm">
                            {msg.content || `[${msg.mediaType || msg.type}]`}
                          </p>
                          <p className="text-[10px] opacity-70 mt-1">
                            {formatDistanceToNow(
                              new Date(
                                typeof msg.timestamp === "number"
                                  ? msg.timestamp * 1000
                                  : msg.timestamp
                              ),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a chat to view messages
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
