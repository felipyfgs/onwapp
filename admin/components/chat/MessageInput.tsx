"use client";

import { useState, useRef, useCallback, KeyboardEvent, ChangeEvent, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudioRecording } from "@/hooks/chat/useAudioRecording";
import { AttachmentPopover } from "./message-input/AttachmentPopover";
import { EmojiPicker } from "./message-input/EmojiPicker";
import { RecordingIndicator } from "./message-input/RecordingIndicator";
import { TypingIndicator } from "./message-input/TypingIndicator";

// Types
type MediaType = "image" | "video" | "document";

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onSendMedia?: (type: MediaType, file: File) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSendMessage,
  onSendMedia,
  disabled,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    formatRecordingTime,
  } = useAudioRecording();

  // Memoize trimmed message to avoid recalculating it
  const trimmedMessage = useMemo(() => message.trim(), [message]);

  // Memoize formatted time to prevent unnecessary recalculations
  const formattedRecordingTime = useMemo(() => 
    formatRecordingTime(recordingTime), 
    [recordingTime, formatRecordingTime]
  );

  const handleSend = useCallback(() => {
    const text = trimmedMessage;
    if (text && !disabled) {
      onSendMessage(text);
      setMessage("");
      textareaRef.current?.focus();
    }
  }, [trimmedMessage, disabled, onSendMessage]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    
    // Update typing indicator
    if (!isTyping && newValue.length > 0) {
      setIsTyping(true);
    } else if (isTyping && newValue.length === 0) {
      setIsTyping(false);
    }
  }, [isTyping]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (onSendMedia) {
      const type = file.type.startsWith("image/") 
        ? "image" 
        : file.type.startsWith("video/") 
        ? "video" 
        : "document";
      onSendMedia(type, file);
    }
  }, [onSendMedia]);

  const handleMainButtonClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else if (trimmedMessage) {
      handleSend();
    } else {
      startRecording();
    }
  }, [isRecording, trimmedMessage, handleSend, startRecording, stopRecording]);

  // Memoize button icon to prevent unnecessary re-renders
  const ButtonIcon = useMemo(() => {
    if (isRecording) return <X className="h-4 w-4" />;
    if (trimmedMessage) return <Send className="h-4 w-4" />;
    return <Mic className="h-4 w-4" />;
  }, [isRecording, trimmedMessage]);

  return (
    <div className="border-t bg-background">
      <div className="flex items-center gap-1 p-2">
        {isTyping && <TypingIndicator />}
        
        <AttachmentPopover 
          onFileSelect={handleFileSelect}
          disabled={disabled}
        />

        <EmojiPicker 
          onEmojiSelect={handleEmojiSelect}
          disabled={disabled}
        />

        {/* Message input */}
        <div className="flex-1 min-w-0">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-8 max-h-24 px-3 py-1.5 resize-none bg-muted/50 border-0 focus:bg-background transition-colors text-sm"
            rows={1}
          />
        </div>

        {/* Send/Record button */}
        <Button
          size="sm"
          className={cn(
            "h-8 w-8 transition-all duration-200",
            trimmedMessage
              ? "bg-primary hover:bg-primary/90"
              : "bg-muted hover:bg-muted/80 text-muted-foreground",
            isRecording && "bg-red-500 hover:bg-red-600 text-white animate-pulse"
          )}
          onClick={handleMainButtonClick}
          disabled={disabled}
        >
          <ButtonIcon />
        </Button>
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="px-2 pb-2">
          <RecordingIndicator
            formattedTime={formattedRecordingTime}
            onCancel={stopRecording}
            onSend={stopRecording}
          />
        </div>
      )}
    </div>
  );
}
