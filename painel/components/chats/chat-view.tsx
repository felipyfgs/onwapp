"use client"

import { useEffect, useState, useCallback, useRef, useImperativeHandle, forwardRef, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Phone,
  Video,
  Search,
  MoreVertical,
  Plus,
  Smile,
  Mic,
  Send,
  Users,
  Loader2,
  Image as ImageIcon,
  FileText,
  X,
} from "lucide-react"
import {
  Chat,
  ChatMessage,
  sendTextMessage,
  sendImageMessage,
  sendVideoMessage,
  sendDocumentMessage,
  sendAudioMessage,
  fileToBase64,
} from "@/lib/api/chats"
import { useChatMessages, useAddMessage, useUpdateMessageStatus } from "@/hooks/use-chat-messages"
import { ChatMessageBubble } from "./chat-message-bubble"
import {
  getDisplayName,
  getInitials,
  formatLastSeen,
  getPhoneFromJid,
  groupMessagesByDate,
} from "@/lib/utils/chat-helpers"

interface ChatViewProps {
  chat: Chat
  sessionId: string
  onBack?: () => void
  newMessage?: ChatMessage | null
}

export interface ChatViewRef {
  addMessage: (message: ChatMessage) => void
  updateMessageStatus: (messageIds: string[], status: string) => void
}

export const ChatView = forwardRef<ChatViewRef, ChatViewProps>(function ChatView(
  { chat, sessionId, onBack, newMessage },
  ref
) {
  // Use centralized message hook (TanStack Query + IndexedDB)
  const { messages, isLoading: loading } = useChatMessages(sessionId, chat.jid)
  const addMessageToCache = useAddMessage()
  const updateStatusInCache = useUpdateMessageStatus()

  // Local UI state only
  const [inputValue, setInputValue] = useState("")
  const [sending, setSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  // Refs
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioChunksRef.current = []
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  // Handle new message from WebSocket - add to cache
  useEffect(() => {
    if (newMessage && newMessage.chatJid === chat.jid) {
      addMessageToCache(sessionId, chat.jid, newMessage)
    }
  }, [newMessage, chat.jid, sessionId, addMessageToCache])

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addMessage: (message: ChatMessage) => {
      if (message.chatJid !== chat.jid) return
      addMessageToCache(sessionId, chat.jid, message)
    },
    updateMessageStatus: (messageIds: string[], status: string) => {
      updateStatusInCache(sessionId, chat.jid, messageIds, status)
    },
  }), [chat.jid, sessionId, addMessageToCache, updateStatusInCache])

  // Track if user is at bottom of chat
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100
    }
  }, [])

  // Scroll to bottom when new messages arrive (if user was at bottom)
  useEffect(() => {
    if (scrollRef.current && !loading) {
      // Always scroll if was at bottom OR if new message was added
      const shouldScroll = isAtBottomRef.current || messages.length > 0
      if (shouldScroll) {
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }
        }, 50)
      }
    }
  }, [messages.length, loading])

  // Get phone number from JID for API calls
  const phone = useMemo(() => getPhoneFromJid(chat.jid), [chat.jid])

  // Add optimistic message to cache
  const addOptimisticMessage = useCallback((msgId: string, content: string, type: string = "text") => {
    const optimisticMsg: ChatMessage = {
      msgId,
      chatJid: chat.jid,
      timestamp: Math.floor(Date.now() / 1000),
      type,
      content,
      fromMe: true,
      isGroup: chat.isGroup,
      status: "pending",
    }
    addMessageToCache(sessionId, chat.jid, optimisticMsg)
  }, [chat.jid, chat.isGroup, sessionId, addMessageToCache])

  // Update optimistic message with real data
  const updateOptimisticMessage = useCallback((tempId: string, _realId: string, _timestamp: number) => {
    // The real message will come via WebSocket, just update status
    updateStatusInCache(sessionId, chat.jid, [tempId], "sent")
  }, [sessionId, chat.jid, updateStatusInCache])

  // Send text message
  const handleSendText = useCallback(async () => {
    const text = inputValue.trim()
    if (!text || sending) return

    const tempId = `temp-${Date.now()}`
    setInputValue("")
    setSending(true)
    addOptimisticMessage(tempId, text)

    try {
      const response = await sendTextMessage(sessionId, phone, text)
      updateOptimisticMessage(tempId, response.messageId, response.timestamp)
    } catch (error) {
      console.error("Failed to send message:", error)
      updateStatusInCache(sessionId, chat.jid, [tempId], "error")
    } finally {
      setSending(false)
    }
  }, [inputValue, sending, sessionId, phone, chat.jid, addOptimisticMessage, updateOptimisticMessage, updateStatusInCache])

  // Handle Enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }, [handleSendText])

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || sending) return

    const tempId = `temp-${Date.now()}`
    setSending(true)

    try {
      const base64 = await fileToBase64(file)
      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")

      addOptimisticMessage(tempId, file.name, isImage ? "image" : isVideo ? "video" : "document")

      let response
      if (isImage) {
        response = await sendImageMessage(sessionId, phone, base64, "", file.type)
      } else if (isVideo) {
        response = await sendVideoMessage(sessionId, phone, base64, "", file.type)
      } else {
        response = await sendDocumentMessage(sessionId, phone, base64, file.name, file.type)
      }

      updateOptimisticMessage(tempId, response.messageId, response.timestamp)
    } catch (error) {
      console.error("Failed to send file:", error)
      updateStatusInCache(sessionId, chat.jid, [tempId], "error")
    } finally {
      setSending(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [sending, sessionId, phone, chat.jid, addOptimisticMessage, updateOptimisticMessage, updateStatusInCache])

  // Start audio recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } catch (error) {
      console.error("Failed to start recording:", error)
    }
  }, [])

  // Stop and send audio recording
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!
      
      mediaRecorder.onstop = async () => {
        // Clear interval
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
          recordingIntervalRef.current = null
        }

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach((track) => track.stop())

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const tempId = `temp-${Date.now()}`

        setSending(true)
        addOptimisticMessage(tempId, "Mensagem de voz", "ptt")

        try {
          // Convert blob to base64
          const reader = new FileReader()
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(",")[1]
            try {
              const response = await sendAudioMessage(sessionId, phone, base64, true)
              updateOptimisticMessage(tempId, response.messageId, response.timestamp)
            } catch (error) {
              console.error("Failed to send audio:", error)
              updateStatusInCache(sessionId, chat.jid, [tempId], "error")
            } finally {
              setSending(false)
            }
          }
          reader.readAsDataURL(audioBlob)
        } catch (error) {
          console.error("Failed to process audio:", error)
          setSending(false)
        }

        setIsRecording(false)
        setRecordingTime(0)
        mediaRecorderRef.current = null
        resolve()
      }

      mediaRecorder.stop()
    })
  }, [sessionId, phone, chat.jid, addOptimisticMessage, updateOptimisticMessage, updateStatusInCache])

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      mediaRecorderRef.current = null
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    setIsRecording(false)
    setRecordingTime(0)
    audioChunksRef.current = []
  }, [])

  // Format recording time
  // Format recording time
  const formatRecordingTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  // Memoize message groups to avoid recalculation on every render
  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages])

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-14 shrink-0 bg-card border-b border-border">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={chat.profilePicture} alt={getDisplayName(chat)} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {chat.isGroup ? <Users className="h-5 w-5" /> : getInitials(chat)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate text-sm">{getDisplayName(chat)}</h2>
          <p className="text-xs text-muted-foreground truncate">
            {chat.isGroup ? "Grupo" : formatLastSeen(chat.lastMessage?.timestamp)}
          </p>
        </div>

        <div className="flex items-center shrink-0">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hidden sm:flex">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-background"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Nenhuma mensagem</p>
          </div>
        ) : (
          <div className="px-3 py-2 sm:px-4 sm:py-3">
            {messageGroups.map((group) => (
              <div key={group.date} className="mb-4">
                {/* Date separator */}
                <div className="flex justify-center mb-3 sticky top-2 z-10">
                  <span className="text-[11px] bg-muted px-3 py-1.5 rounded-lg text-muted-foreground shadow-sm">
                    {group.date}
                  </span>
                </div>

                {/* Messages */}
                <div className="space-y-1">
                  {group.messages.map((msg, idx) => {
                    const prevMsg = idx > 0 ? group.messages[idx - 1] : null
                    const showSender = !prevMsg || prevMsg.senderJid !== msg.senderJid || prevMsg.fromMe !== msg.fromMe

                    return (
                      <ChatMessageBubble
                        key={msg.msgId}
                        message={msg}
                        isGroup={chat.isGroup}
                        showSender={showSender}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,application/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Input Bar */}
      <footer className="flex items-center gap-2 px-3 py-2 bg-card border-t border-border shrink-0">
        {isRecording ? (
          // Recording UI
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelRecording}
              className="shrink-0 h-10 w-10 text-destructive hover:text-destructive"
            >
              <X className="h-6 w-6" />
            </Button>

            <div className="flex-1 flex items-center gap-3 bg-input rounded-3xl px-4 py-2">
              <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-medium text-foreground">
                {formatRecordingTime(recordingTime)}
              </span>
              <span className="text-sm text-muted-foreground">Gravando...</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={stopRecording}
              disabled={sending}
              className="shrink-0 h-10 w-10 text-primary hover:text-primary"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </>
        ) : (
          // Normal input UI
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={sending}
                  className="text-muted-foreground shrink-0 h-10 w-10 hover:text-foreground"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top">
                <DropdownMenuItem onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "image/*"
                    fileInputRef.current.click()
                  }
                }}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Imagem
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "video/*"
                    fileInputRef.current.click()
                  }
                }}>
                  <Video className="h-4 w-4 mr-2" />
                  Vídeo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/*"
                    fileInputRef.current.click()
                  }
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Documento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 flex items-center gap-1 bg-input rounded-3xl px-2 py-1.5">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0 hover:text-foreground">
                <Smile className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Digite uma mensagem"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 h-8 px-1 text-sm placeholder:text-muted-foreground"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={inputValue.trim() ? handleSendText : startRecording}
              disabled={sending}
              className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : inputValue.trim() ? (
                <Send className="h-5 w-5 text-primary" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
          </>
        )}
      </footer>
    </div>
  )
})
