"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, MoreVertical, Search, Users, Loader2, Phone, Video } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChatMessageItem } from "./chat-message-item"
import { ChatInput } from "./chat-input"
import { MediaPreviewModal, createMediaFiles, type MediaFile } from "./media-preview-modal"
import { getChatMessages, sendTextMessage, sendAudioMessage, sendImageMessage, sendVideoMessage, sendDocumentMessage, markChatRead, deleteMessage, editMessage, sendReaction, type Chat, type ChatMessage, type QuotedMessage } from "@/lib/api/chats"
import { getChatAvatarUrl } from "@/lib/api/contacts"
import { useRealtime, type NewMessageData, type MessageStatusData } from "@/hooks/use-realtime"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 50

interface ChatWindowProps {
  sessionId: string
  chat: Chat
  myJid?: string
  onBack?: () => void
}

export function ChatWindow({ sessionId, chat, myJid, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const currentChatJidRef = useRef(chat.jid)

  const phone = chat.jid.split('@')[0]
  
  // Resolve display name: chat.name > contactName > pushName > phone
  // Same priority as chat-list-item.tsx (using Chatwoot logic)
  const displayName = (() => {
    if (chat.name && chat.name.trim() && chat.name.trim() !== phone) {
      return chat.name
    }
    // contactName works for both contacts and groups (from server)
    if (chat.contactName && chat.contactName.trim()) {
      return chat.contactName
    }
    if (!chat.isGroup && !chat.lastMessage?.fromMe && chat.lastMessage?.pushName) {
      return chat.lastMessage.pushName
    }
    return phone
  })()

  // Update current chat ref and reset state when chat changes
  useEffect(() => {
    currentChatJidRef.current = chat.jid
    // Reset state to avoid showing previous chat's messages
    setMessages([])
    setLoading(true)
    setError(null)
    setHasMore(true)
    offsetRef.current = 0
    setReplyingTo(null)
    setEditingMessage(null)
  }, [chat.jid])

  useEffect(() => {
    getChatAvatarUrl(sessionId, chat.jid, chat.isGroup).then(url => setAvatarUrl(url))
  }, [sessionId, chat.jid, chat.isGroup])

  const scrollToBottom = useCallback(() => {
    // With flex-col-reverse, scrollTop 0 is the bottom (most recent messages)
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [])

  // Real-time updates via SSE
  const handleNewMessage = useCallback((data: NewMessageData) => {
    // Only add message if it's for this chat
    if (data.chatJid !== chat.jid) return
    
    // Check if message already exists (avoid duplicates)
    setMessages(prev => {
      if (prev.some(m => m.msgId === data.msgId)) return prev
      
      const newMessage: ChatMessage = {
        msgId: data.msgId,
        chatJid: data.chatJid,
        senderJid: data.senderJid,
        pushName: data.pushName,
        timestamp: data.timestamp,
        type: data.type,
        mediaType: data.mediaType,
        content: data.content,
        fromMe: data.fromMe,
        isGroup: data.isGroup,
        status: data.fromMe ? 'sent' : undefined,
      }
      return [...prev, newMessage]
    })
    
    // Mark received message as read immediately (sends blue tick)
    if (!data.fromMe) {
      markChatRead(sessionId, chat.jid, [data.msgId]).catch(() => {})
    }
    
    // Auto-scroll to bottom for new messages
    setTimeout(() => scrollToBottom(), 100)
  }, [chat.jid, scrollToBottom, sessionId])

  const handleMessageStatus = useCallback((data: MessageStatusData) => {
    if (data.chatJid !== chat.jid) return
    
    // Handle deleted messages - mark as deleted instead of removing
    if (data.status === 'deleted') {
      setMessages(prev => prev.map(msg => 
        msg.msgId === data.msgId 
          ? { ...msg, deleted: true, content: '', mediaType: undefined }
          : msg
      ))
      return
    }
    
    setMessages(prev => prev.map(msg => 
      msg.msgId === data.msgId 
        ? { ...msg, status: data.status }
        : msg
    ))
  }, [chat.jid])

  useRealtime({
    sessionId,
    onMessage: handleNewMessage,
    onMessageStatus: handleMessageStatus,
  })

  // Polling fallback for real-time updates (in case SSE fails)
  useEffect(() => {
    if (loading || messages.length === 0) return

    const pollNewMessages = async () => {
      try {
        // Get latest messages and check for new ones
        const latestMessages = await getChatMessages(sessionId, chat.jid, 20, 0)
        
        setMessages(prev => {
          // Find messages that don't exist in current list
          const existingIds = new Set(prev.map(m => m.msgId))
          const newMessages = latestMessages.filter(m => !existingIds.has(m.msgId))
          
          if (newMessages.length > 0) {
            console.log('[Polling] Found new messages:', newMessages.length)
            // Also update status of existing messages
            const updatedPrev = prev.map(existing => {
              const updated = latestMessages.find(m => m.msgId === existing.msgId)
              return updated ? { ...existing, status: updated.status } : existing
            })
            return [...updatedPrev, ...newMessages].sort((a, b) => a.timestamp - b.timestamp)
          }
          
          // Just update status of existing messages
          return prev.map(existing => {
            const updated = latestMessages.find(m => m.msgId === existing.msgId)
            return updated ? { ...existing, status: updated.status } : existing
          })
        })
      } catch {
        // Silent fail - SSE might be working
      }
    }

    const interval = setInterval(pollNewMessages, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [sessionId, chat.jid, loading, messages.length])

  const loadMessages = useCallback(async () => {
    const chatJidAtStart = chat.jid
    try {
      setLoading(true)
      setError(null)
      setHasMore(true)
      offsetRef.current = 0
      const data = await getChatMessages(sessionId, chat.jid, PAGE_SIZE, 0)
      
      // Only update state if we're still on the same chat
      if (currentChatJidRef.current === chatJidAtStart) {
        setMessages(data)
        if (data.length < PAGE_SIZE) setHasMore(false)
      }
    } catch (err) {
      // Only show error if we're still on the same chat
      if (currentChatJidRef.current === chatJidAtStart) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens')
      }
    } finally {
      // Only clear loading if we're still on the same chat
      if (currentChatJidRef.current === chatJidAtStart) {
        setLoading(false)
      }
    }
  }, [sessionId, chat.jid])

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore) return
    
    const chatJidAtStart = chat.jid
    setLoadingMore(true)
    // With flex-col-reverse, we need to preserve scroll position from bottom
    const scrollTopBefore = containerRef.current?.scrollTop || 0
    
    try {
      const newOffset = offsetRef.current + PAGE_SIZE
      const older = await getChatMessages(sessionId, chat.jid, PAGE_SIZE, newOffset)
      
      // Only update state if we're still on the same chat
      if (currentChatJidRef.current !== chatJidAtStart) {
        setLoadingMore(false)
        return
      }
      
      if (older.length < PAGE_SIZE) setHasMore(false)
      if (older.length === 0) {
        setLoadingMore(false)
        return
      }
      
      offsetRef.current = newOffset
      setMessages(prev => [...older, ...prev])
      
      // With flex-col-reverse, maintain scroll position after adding older messages
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = scrollTopBefore
        }
      })
    } catch (err) {
      console.error('Erro ao carregar mais mensagens:', err)
    } finally {
      if (currentChatJidRef.current === chatJidAtStart) {
        setLoadingMore(false)
      }
    }
  }, [sessionId, chat.jid, loadingMore, hasMore])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // IntersectionObserver for loading more messages when scrolling to top
  useEffect(() => {
    const sentinel = topSentinelRef.current
    if (!sentinel || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreMessages()
        }
      },
      { threshold: 0.1, root: containerRef.current }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, loadMoreMessages])

  // Mark received messages as read (sends blue ticks)
  useEffect(() => {
    if (messages.length === 0 || loading) return
    
    // Filter only received messages (not from me) to mark as read
    const receivedMessages = messages
      .filter(m => !m.fromMe)
      .slice(-20) // Last 20 received messages
      .map(m => m.msgId)
    
    if (receivedMessages.length > 0) {
      markChatRead(sessionId, chat.jid, receivedMessages).catch(() => {})
    }
  }, [sessionId, chat.jid, messages, loading])

  const handleSendMessage = async (text: string) => {
    setSending(true)
    try {
      const recipient = chat.isGroup ? chat.jid : phone
      
      // If editing, update the message instead
      if (editingMessage) {
        await editMessage(sessionId, phone, editingMessage.msgId, text)
        setMessages(prev => prev.map(m => 
          m.msgId === editingMessage.msgId ? { ...m, content: text } : m
        ))
        setEditingMessage(null)
        return
      }
      
      // Build quoted message if replying
      const quoted: QuotedMessage | undefined = replyingTo ? {
        messageId: replyingTo.msgId,
        chatJid: replyingTo.chatJid,
        senderJid: replyingTo.senderJid,
      } : undefined
      
      const response = await sendTextMessage(sessionId, recipient, text, chat.isGroup, quoted)
      const newMessage: ChatMessage = {
        msgId: response.messageId,
        chatJid: chat.jid,
        timestamp: response.timestamp,
        type: 'text',
        content: text,
        fromMe: true,
        isGroup: chat.isGroup,
        status: 'sent',
        quotedId: replyingTo?.msgId,
      }
      setMessages(prev => [...prev, newMessage])
      setReplyingTo(null)
      setTimeout(() => scrollToBottom(), 100)
    } catch (err) {
      throw err
    } finally {
      setSending(false)
    }
  }

  // Message action handlers
  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message)
    setEditingMessage(null)
  }

  const handleReact = async (message: ChatMessage, emoji: string) => {
    try {
      await sendReaction(sessionId, phone, message.msgId, emoji)
    } catch (err) {
      console.error('Failed to send reaction:', err)
    }
  }

  const handleEdit = (message: ChatMessage) => {
    setEditingMessage(message)
    setReplyingTo(null)
  }

  const handleDelete = async (message: ChatMessage, forMe: boolean) => {
    const markAsDeleted = () => {
      setMessages(prev => prev.map(m => 
        m.msgId === message.msgId 
          ? { ...m, deleted: true, content: '', mediaType: undefined }
          : m
      ))
    }
    
    try {
      await deleteMessage(sessionId, phone, message.msgId, forMe)
      // Mark as deleted in UI if deleted for everyone
      if (!forMe) {
        markAsDeleted()
      }
    } catch (err) {
      // Error 479 means message was already deleted on WhatsApp - mark as deleted anyway
      const errorMsg = err instanceof Error ? err.message : ''
      if (errorMsg.includes('479')) {
        markAsDeleted()
      } else {
        console.error('Failed to delete message:', err)
      }
    }
  }

  const cancelReplyOrEdit = () => {
    setReplyingTo(null)
    setEditingMessage(null)
  }

  const handleScrollToMessage = useCallback((msgId: string) => {
    const element = document.getElementById(`msg-${msgId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Highlight effect
      element.classList.add('bg-[#2a3942]')
      setTimeout(() => {
        element.classList.remove('bg-[#2a3942]')
      }, 1500)
    }
  }, [])

  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    // Deduplicate messages by msgId first
    const uniqueMsgs = Array.from(
      new Map(msgs.map(m => [m.msgId, m])).values()
    )
    
    const groupMap = new Map<string, ChatMessage[]>()
    const sortedMsgs = uniqueMsgs.sort((a, b) => a.timestamp - b.timestamp)

    sortedMsgs.forEach(msg => {
      const date = new Date(msg.timestamp * 1000).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
      
      if (!groupMap.has(date)) {
        groupMap.set(date, [])
      }
      groupMap.get(date)!.push(msg)
    })

    return Array.from(groupMap.entries()).map(([date, messages]) => ({
      date,
      messages
    }))
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden bg-muted/20">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-2 border-b bg-card shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden size-10">
            <ArrowLeft className="size-5" />
          </Button>
        )}
        
        <Avatar className="size-10 cursor-pointer">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
          <AvatarFallback className={cn(
            "text-white font-medium",
            chat.isGroup ? "bg-emerald-600" : "bg-slate-500"
          )}>
            {chat.isGroup ? <Users className="size-5" /> : displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 cursor-pointer">
          <h2 className="font-medium text-[16px] truncate leading-tight">{displayName}</h2>
          <p className="text-[13px] text-muted-foreground truncate leading-tight">
            {chat.isGroup ? 'toque para info do grupo' : 'toque para info do contato'}
          </p>
        </div>

        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-muted-foreground size-10">
            <Video className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground size-10">
            <Phone className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground size-10">
            <Search className="size-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground size-10">
                <MoreVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem>Dados do contato</DropdownMenuItem>
              <DropdownMenuItem>Selecionar mensagens</DropdownMenuItem>
              <DropdownMenuItem>Fechar conversa</DropdownMenuItem>
              <DropdownMenuItem>Silenciar notificacoes</DropdownMenuItem>
              <DropdownMenuItem>Mensagens temporarias</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Limpar conversa</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Apagar conversa</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages area with WhatsApp-style pattern - using flex-col-reverse for auto scroll to bottom */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 md:px-4 py-2 flex flex-col-reverse whatsapp-bg"
      >
        {loading ? (
          <div className="space-y-3 py-4 flex flex-col-reverse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                <Skeleton className={cn("h-10 rounded-lg", i % 2 === 0 ? "w-48" : "w-32")} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Nenhuma mensagem</p>
            <p className="text-xs mt-1">Envie uma mensagem para iniciar a conversa</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {messageGroups.map(group => (
              <div key={group.date}>
                <div className="flex justify-center my-3">
                  <span className="text-[12.5px] text-[#8696a0] bg-[#182229] px-3 py-1.5 rounded-lg shadow-sm">
                    {group.date}
                  </span>
                </div>
                <div>
                  {group.messages.map(msg => (
                    <div key={msg.msgId} id={`msg-${msg.msgId}`} className="transition-colors duration-500">
                      <ChatMessageItem 
                        message={msg} 
                        showSender={chat.isGroup}
                        sessionId={sessionId}
                        myJid={myJid}
                        allMessages={messages}
                        onReply={handleReply}
                        onReact={handleReact}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onScrollToMessage={handleScrollToMessage}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {/* Top sentinel and loading indicators - shown above messages due to column-reverse */}
        {!loading && messages.length > 0 && (
          <div className="flex flex-col">
            {!hasMore && (
              <div className="flex justify-center py-3 mb-2">
                <span className="text-xs text-muted-foreground bg-card/90 px-3 py-1.5 rounded-lg shadow-sm">
                  Inicio da conversa
                </span>
              </div>
            )}
            
            {loadingMore && (
              <div className="flex justify-center py-3">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            
            <div ref={topSentinelRef} className="h-1" />
          </div>
        )}
      </div>

      {/* Input area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onSendAudio={async (blob) => {
          try {
            setSending(true)
            const reader = new FileReader()
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => {
                const result = reader.result as string
                const base64 = result.split(',')[1]
                resolve(base64)
              }
              reader.onerror = reject
            })
            reader.readAsDataURL(blob)
            const audioBase64 = await base64Promise
            
            await sendAudioMessage(sessionId, phone, audioBase64, true, blob.type)
            await loadMessages()
          } catch (err) {
            console.error('Erro ao enviar audio:', err)
            setError(err instanceof Error ? err.message : 'Erro ao enviar audio')
          } finally {
            setSending(false)
          }
        }}
        onSelectFiles={(type, files) => {
          const mediaFilesData = createMediaFiles(files)
          setMediaFiles(mediaFilesData)
        }}
        disabled={loading || sending}
        replyingTo={replyingTo}
        editingMessage={editingMessage}
        onCancelReplyOrEdit={cancelReplyOrEdit}
      />

      {/* Media Preview Modal */}
      {mediaFiles.length > 0 && (
        <MediaPreviewModal
          files={mediaFiles}
          onFilesChange={setMediaFiles}
          onSend={async (filesToSend) => {
            try {
              setSending(true)
              
              for (const mediaFile of filesToSend) {
                const reader = new FileReader()
                const base64Promise = new Promise<string>((resolve, reject) => {
                  reader.onload = () => {
                    const result = reader.result as string
                    const base64 = result.split(',')[1]
                    resolve(base64)
                  }
                  reader.onerror = reject
                })
                reader.readAsDataURL(mediaFile.file)
                const fileBase64 = await base64Promise
                
                switch (mediaFile.type) {
                  case 'image':
                    await sendImageMessage(sessionId, phone, fileBase64, mediaFile.caption, mediaFile.file.type)
                    break
                  case 'video':
                    await sendVideoMessage(sessionId, phone, fileBase64, mediaFile.caption, mediaFile.file.type)
                    break
                  case 'audio':
                    await sendAudioMessage(sessionId, phone, fileBase64, false, mediaFile.file.type)
                    break
                  case 'document':
                    await sendDocumentMessage(sessionId, phone, fileBase64, mediaFile.file.name, mediaFile.caption, mediaFile.file.type)
                    break
                }
              }
              
              await loadMessages()
              setMediaFiles([])
            } catch (err) {
              console.error('Erro ao enviar arquivos:', err)
              setError(err instanceof Error ? err.message : 'Erro ao enviar arquivos')
            } finally {
              setSending(false)
            }
          }}
          onClose={() => {
            mediaFiles.forEach(f => URL.revokeObjectURL(f.preview))
            setMediaFiles([])
          }}
          disabled={sending}
        />
      )}
    </div>
  )
}
