"use client";

import { Message } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Check,
  CheckCheck,
  Clock,
  Image as ImageIcon,
  FileText,
  Mic,
  Video,
  MapPin,
  Contact,
  Sticker,
  Play,
  Download,
} from "lucide-react";
import { formatMessageTime } from "@/lib/date-utils";

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  senderPicture?: string;
  searchQuery?: string;
}

function MessageStatus({ status }: { status?: string }) {
  switch (status) {
    case "sent":
      return <Check className="h-3 w-3 text-muted-foreground" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    case "read":
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    case "pending":
      return <Clock className="h-3 w-3 text-muted-foreground" />;
    default:
      return null;
  }
}

function MediaPreview({ message }: { message: Message }) {
  const { type, mediaUrl, content } = message;
  
  switch (type) {
    case "image":
      return (
        <div className="relative rounded-lg overflow-hidden max-w-xs">
          {mediaUrl ? (
            <img
              src={mediaUrl}
              alt="Image"
              className="w-full h-auto max-h-64 object-cover"
            />
          ) : (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Image</span>
            </div>
          )}
          {content && <p className="mt-1 text-sm">{content}</p>}
        </div>
      );
      
    case "video":
      return (
        <div className="relative rounded-lg overflow-hidden max-w-xs">
          {mediaUrl ? (
            <div className="relative">
              <video
                src={mediaUrl}
                className="w-full h-auto max-h-64 object-cover rounded-lg"
                controls
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Video className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Video</span>
            </div>
          )}
          {content && <p className="mt-1 text-sm">{content}</p>}
        </div>
      );
      
    case "audio":
    case "ptt":
      return (
        <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg min-w-48">
          <button className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
          </button>
          <div className="flex-1">
            <div className="h-1 bg-muted rounded-full">
              <div className="h-full w-0 bg-primary rounded-full" />
            </div>
            <span className="text-xs text-muted-foreground mt-1">0:00</span>
          </div>
          <Mic className="h-4 w-4 text-muted-foreground" />
        </div>
      );
      
    case "document":
      return (
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg min-w-48">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {content || "Document"}
            </p>
            <p className="text-xs text-muted-foreground">PDF, DOC</p>
          </div>
          <Download className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>
      );
      
    case "sticker":
      return (
        <div className="max-w-32">
          {mediaUrl ? (
            <img src={mediaUrl} alt="Sticker" className="w-full h-auto" />
          ) : (
            <div className="h-24 w-24 bg-muted/50 rounded-lg flex items-center justify-center">
              <Sticker className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
      );
      
    case "location":
      return (
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
          <MapPin className="h-5 w-5 text-red-500" />
          <span className="text-sm">{content || "Location shared"}</span>
        </div>
      );
      
    case "contact":
    case "vcard":
      return (
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
          <Contact className="h-5 w-5 text-primary" />
          <span className="text-sm">{content || "Contact shared"}</span>
        </div>
      );
      
    default:
      return null;
  }
}

export function MessageBubble({ message, showAvatar, senderPicture, searchQuery }: MessageBubbleProps) {
  const isMe = message.isFromMe;
  const isMedia = ["image", "video", "audio", "ptt", "document", "sticker", "location", "contact", "vcard"].includes(message.type);
  
  return (
    <div className={cn(
      "flex gap-2 px-2 sm:px-4 py-1 w-full group min-w-0",
      isMe ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar for received messages */}
      {!isMe && showAvatar && (
        <Avatar className="h-7 w-7 shrink-0 shadow-sm ring-1 ring-background">
          {senderPicture && <AvatarImage src={senderPicture} />}
          <AvatarFallback className="text-xs bg-primary text-primary-foreground font-medium">
            {message.senderName 
              ? message.senderName.substring(0, 2).toUpperCase()
              : message.senderJid?.split("@")[0]?.slice(-2) || "US"
            }
          </AvatarFallback>
        </Avatar>
      )}
      {!isMe && !showAvatar && <div className="w-7 shrink-0" />}
      
      {/* Message Bubble */}
      <div className={cn(
        "max-w-[70%] sm:max-w-[65%] md:max-w-[60%] lg:max-w-[55%] rounded-2xl px-3 py-2 relative overflow-hidden min-w-0 shadow-sm transition-all duration-200 hover:shadow-md",
        isMe 
          ? "bg-primary text-primary-foreground rounded-br-md hover:bg-primary/95" 
          : "bg-card border border-border/50 rounded-bl-md hover:bg-card/80"
      )}>
        {/* Sender name for group chats */}
        {!isMe && message.senderName && showAvatar && (
          <p className="text-xs font-medium text-primary mb-1 truncate">
            {message.senderName}
          </p>
        )}
        
        {/* Quoted message */}
        {message.quotedMessage && (
          <div className={cn(
            "mb-2 p-2 rounded-lg border-l-2 text-xs cursor-pointer hover:opacity-80 transition-opacity",
            isMe 
              ? "bg-primary-foreground/10 border-primary-foreground/30" 
              : "bg-background border-primary"
          )}>
            <p className="font-medium truncate">
              {message.quotedMessage.senderName || "You"}
            </p>
            <p className="truncate opacity-80">
              {message.quotedMessage.content || "Media"}
            </p>
          </div>
        )}
        
        {/* Media content */}
        {isMedia && <MediaPreview message={message} />}
        
        {/* Text content */}
        {message.type === "text" && message.content && (
          <p className="text-sm whitespace-pre-wrap break-words overflow-hidden leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {searchQuery ? highlightSearchText(message.content, searchQuery) : message.content}
          </p>
        )}
        
        {/* Time and status */}
        <div className={cn(
          "flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          isMe ? "justify-end" : "justify-start"
        )}>
          <span className={cn(
            "text-[10px] font-medium",
            isMe ? "text-primary-foreground/60" : "text-muted-foreground"
          )}>
            {formatMessageTime(message.timestamp)}
          </span>
          {isMe && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
}

// Helper function to highlight search text
function highlightSearchText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-300/80 text-yellow-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}
