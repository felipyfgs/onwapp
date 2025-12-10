"use client"

import { memo, useState, useCallback } from "react"
import { Check, CheckCheck, Clock } from "lucide-react"
import { ChatMessage, getMediaUrl } from "@/lib/api/chats"
import { cn } from "@/lib/utils"
import { formatTime, isAudioMessage, isDocumentMessage, isImageMessage, isVideoMessage, isStickerMessage } from "@/lib/utils/chat-helpers"
import { ImageMessage, VideoMessage, AudioMessage, DocumentMessage, StickerMessage } from "./chat-media"
import { MediaViewer } from "./media-viewer"
import { useAvatar } from "@/hooks/use-avatar"

interface ChatMessageBubbleProps {
  message: ChatMessage
  sessionId: string
  isGroup: boolean
  showSender: boolean
  chatAvatar?: string // Avatar do chat (usado em conversas 1:1)
}

function MessageStatus({ status, fromMe }: { status?: string; fromMe: boolean }) {
  if (!fromMe) return null

  if (status === "read") {
    return <CheckCheck className="h-4 w-4 text-sky-400" />
  }
  if (status === "delivered") {
    return <CheckCheck className="h-4 w-4 text-muted-foreground" />
  }
  if (status === "sent") {
    return <Check className="h-4 w-4 text-muted-foreground" />
  }
  return <Clock className="h-3 w-3 text-muted-foreground" />
}

export const ChatMessageBubble = memo(function ChatMessageBubble({ 
  message,
  sessionId,
  isGroup, 
  showSender,
  chatAvatar
}: ChatMessageBubbleProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerType, setViewerType] = useState<"image" | "video">("image")

  const isFromMe = message.fromMe
  const isDeleted = message.deleted
  const isAudio = isAudioMessage(message)
  const isDocument = isDocumentMessage(message)
  const isImage = isImageMessage(message)
  const isVideo = isVideoMessage(message)
  const isSticker = isStickerMessage(message)
  const isMedia = isImage || isVideo || isAudio || isDocument || isSticker

  const mediaUrl = isMedia ? getMediaUrl(sessionId, message.msgId) : ""

  // Get sender avatar for groups (fetches from API and caches)
  const { data: senderAvatar } = useAvatar(
    sessionId,
    isGroup && !isFromMe ? message.senderJid : undefined
  )

  // Use sender avatar for groups, chat avatar for 1:1
  const messageAvatar = isGroup ? senderAvatar : chatAvatar

  const handleViewMedia = useCallback((type: "image" | "video") => {
    setViewerType(type)
    setViewerOpen(true)
  }, [])

  // Stickers have transparent background
  if (isSticker && !isDeleted) {
    return (
      <>
        <div className={cn("flex", isFromMe ? "justify-end" : "justify-start")}>
          <div className="relative">
            <StickerMessage 
              src={mediaUrl} 
              onView={() => handleViewMedia("image")} 
            />
            <div className={cn(
              "flex items-center justify-end gap-1 mt-1",
              isFromMe ? "text-muted-foreground" : "text-muted-foreground"
            )}>
              <span className="text-[11px]">
                {formatTime(message.timestamp)}
              </span>
              <MessageStatus status={message.status} fromMe={isFromMe} />
            </div>
          </div>
        </div>
        <MediaViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          src={mediaUrl}
          type="image"
        />
      </>
    )
  }

  return (
    <>
      <div className={cn("flex", isFromMe ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "relative max-w-[85%] sm:max-w-[75%] px-3 py-2 shadow-sm",
            isFromMe
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
              : "bg-card text-card-foreground rounded-2xl rounded-tl-sm",
            isDeleted && "opacity-60 italic",
            // Remove padding for media messages
            (isImage || isVideo) && !isDeleted && "p-1 pb-2"
          )}
        >
          {/* Sender name for groups */}
          {isGroup && !isFromMe && showSender && message.pushName && (
            <p className={cn(
              "text-xs font-semibold text-primary mb-0.5",
              (isImage || isVideo) && "px-2 pt-1"
            )}>
              {message.pushName}
            </p>
          )}

          {/* Message content */}
          <div className="leading-relaxed">
            {isDeleted ? (
              <p className="text-sm italic">Mensagem apagada</p>
            ) : isAudio ? (
              <AudioMessage 
                src={mediaUrl} 
                isFromMe={isFromMe}
                avatar={isFromMe ? undefined : messageAvatar || undefined}
              />
            ) : isDocument ? (
              <DocumentMessage 
                src={mediaUrl} 
                filename={message.content} 
                isFromMe={isFromMe} 
              />
            ) : isImage ? (
              <ImageMessage 
                src={mediaUrl} 
                caption={message.content}
                onView={() => handleViewMedia("image")} 
              />
            ) : isVideo ? (
              <VideoMessage 
                src={mediaUrl} 
                caption={message.content}
                onView={() => handleViewMedia("video")} 
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content || `[${message.mediaType || message.type}]`}
              </p>
            )}
          </div>

          {/* Timestamp and status */}
          <div className={cn(
            "flex items-center justify-end gap-1 -mb-0.5 mt-0.5",
            (isImage || isVideo) && !isDeleted && "px-2"
          )}>
            <span className={cn(
              "text-[11px]",
              isFromMe ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {formatTime(message.timestamp)}
            </span>
            <MessageStatus status={message.status} fromMe={isFromMe} />
          </div>
        </div>
      </div>

      {/* Media Viewer Dialog */}
      {(isImage || isVideo) && (
        <MediaViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          src={mediaUrl}
          type={viewerType}
          caption={message.content}
        />
      )}
    </>
  )
})
