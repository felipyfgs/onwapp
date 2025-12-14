"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Image,
  File,
  Video,
  Camera,
  MapPin,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onSendMedia?: (type: string, file: File) => void;
  disabled?: boolean;
  placeholder?: string;
}

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😊", "😍", "🥰", "😘",
  "😂", "🤣", "😎", "🤔", "😴", "🤗", "😇", "🙃",
  "👍", "👎", "👌", "✌️", "🤝", "🙏", "💪", "🎉",
  "❤️", "💔", "💯", "⭐", "🔥", "✨", "💥", "🎈",
];

export function MessageInput({
  onSendMessage,
  onSendMedia,
  disabled,
  placeholder = "Type a message..."
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = () => {
    const text = message.trim();
    if (text && !disabled) {
      onSendMessage(text);
      setMessage("");
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setRecordingTime(0);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendMedia) {
      const type = file.type.startsWith("image/") 
        ? "image" 
        : file.type.startsWith("video/") 
        ? "video" 
        : "document";
      onSendMedia(type, file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {isTyping && (
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Digitando...</span>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attach button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground transition-colors"
                disabled={disabled}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-1" align="start">
              <div className="grid grid-cols-4 gap-1">
                <button
                  className="flex flex-col items-center gap-1 p-3 rounded-md hover:bg-accent transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <File className="h-4 w-4" />
                  </div>
                  <span className="text-xs">Arquivo</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1 p-3 rounded-md hover:bg-accent transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Image className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs">Imagem</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1 p-3 rounded-md hover:bg-accent transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Video className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-xs">Vídeo</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1 p-3 rounded-md hover:bg-accent transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <Camera className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-xs">Câmera</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,video/*,application/*"
          />

          {/* Emoji button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground transition-colors"
                disabled={disabled}
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="start">
              <div className="grid grid-cols-8 gap-0.5">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    className="p-2 text-lg hover:bg-accent rounded transition-colors"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Message input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-10 max-h-32 px-4 py-2 resize-none bg-muted/50 border-0 focus:bg-background transition-colors"
              rows={1}
            />
          </div>

          {/* Send/Record button */}
          <Button
            size="icon"
            className={cn(
              "h-10 w-10 transition-all duration-200",
              message.trim()
                ? "bg-primary hover:bg-primary/90"
                : "bg-muted hover:bg-muted/80 text-muted-foreground",
              isRecording && "bg-red-500 hover:bg-red-600 text-white animate-pulse"
            )}
            onClick={() => {
              if (isRecording) {
                stopRecording();
              } else if (message.trim()) {
                handleSend();
              } else {
                startRecording();
              }
            }}
            disabled={disabled}
          >
            {isRecording ? (
              <X className="h-4 w-4" />
            ) : message.trim() ? (
              <Send className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="mt-3 flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-700 dark:text-red-300">
                Gravando áudio... {formatRecordingTime(recordingTime)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={stopRecording}
                className="text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Enviar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
