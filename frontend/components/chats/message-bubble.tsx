"use client"

import { Message } from "@/lib/nats/nats-types"
import { ReadReceipt } from "./read-receipt"
import { MediaPreview } from "./media-preview"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: Message
  isLastFromSender?: boolean
}

export function MessageBubble({ message, isLastFromSender = true }: MessageBubbleProps) {
  const isMe = message.sender === 'me'
  
  return (
    <div className={cn(
      "flex mb-1 px-4 md:px-8",
      isMe ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "relative max-w-[85%] md:max-w-[70%] px-2.5 py-1.5 rounded-lg shadow-sm text-[14.5px] leading-relaxed",
        isMe 
          ? "bg-chart-2/20 text-foreground rounded-tr-none" 
          : "bg-card text-foreground rounded-tl-none border border-border/50"
      )}>
        {/* Tail */}
        {isLastFromSender && (
          <div className={cn(
            "absolute top-0 w-2 h-3",
            isMe 
              ? "-right-1.5 bg-chart-2/20 [clip-path:polygon(0_0,0_100%,100%_0)]" 
              : "-left-1.5 bg-card [clip-path:polygon(0_0,100%_100%,100%_0)]"
          )} />
        )}

        {message.media && (
          <div className="mb-1.5 rounded-sm overflow-hidden">
            <MediaPreview media={message.media} />
          </div>
        )}

        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        <div className="flex items-center justify-end gap-1 mt-1 -mb-0.5">
          <span className="text-[10px] text-gray-500 font-normal">
            {format(message.timestamp, 'HH:mm')}
          </span>
          {isMe && (
            <ReadReceipt status={message.status || 'sent'} className="h-3 w-3" />
          )}
        </div>
      </div>
    </div>
  )
}
