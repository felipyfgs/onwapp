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
  X,
  Image as ImageIcon,
  FileText,
  Video,
  Camera,
  MapPin,
  Contact,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onSendMedia?: (type: string, file: File) => void;
  disabled?: boolean;
  placeholder?: string;
}

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊",
  "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘",
  "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "😝",
  "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "👋",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💔",
  "✅", "❌", "⭐", "🔥", "💯", "🎉", "🎊", "🙏",
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
    <div className="border-t bg-background/95 backdrop-blur-sm p-3 shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      {/* Typing Indicator */}
      {isTyping && (
        <div className="px-3 pb-2 text-xs text-muted-foreground animate-fade-in">
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="ml-1">Digitando...</span>
          </div>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors focus-ring"
              disabled={disabled}
              aria-label="Anexar arquivo"
              title="Anexar arquivo"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="grid grid-cols-3 gap-1">
              <button
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors focus-ring"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Enviar documento"
              >
                <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center transition-transform hover:scale-105">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs">Documento</span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors focus-ring"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Enviar imagem"
              >
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center transition-transform hover:scale-105">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs">Imagem</span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors focus-ring"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Enviar vídeo"
              >
                <div className="h-10 w-10 rounded-full bg-pink-500 flex items-center justify-center transition-transform hover:scale-105">
                  <Video className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs">Vídeo</span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors focus-ring"
                aria-label="Tirar foto"
              >
                <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center transition-transform hover:scale-105">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs">Câmera</span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors focus-ring"
                aria-label="Enviar localização"
              >
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center transition-transform hover:scale-105">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs">Localização</span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors focus-ring"
                aria-label="Enviar contato"
              >
                <div className="h-10 w-10 rounded-full bg-cyan-500 flex items-center justify-center transition-transform hover:scale-105">
                  <Contact className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs">Contato</span>
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
        
        {/* Emoji Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 transition-colors focus-ring"
              disabled={disabled}
              aria-label="Inserir emoji"
              title="Inserir emoji"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  className="p-2 text-xl hover:bg-accent rounded transition-colors focus-ring"
                  onClick={() => insertEmoji(emoji)}
                  aria-label={`Inserir emoji ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-10 max-h-32 resize-none pr-4 focus-ring transition-smooth"
            rows={1}
            aria-label="Mensagem"
            aria-describedby={isTyping ? "typing-indicator" : undefined}
          />
        </div>

        {/* Send / Record Button */}
        {message.trim() ? (
          <Button
            size="icon"
            className="shrink-0 h-10 w-10 transition-colors focus-ring animate-scale-in"
            onClick={handleSend}
            disabled={disabled}
            aria-label="Enviar mensagem"
            title="Enviar mensagem"
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="icon"
            className={cn(
              "shrink-0 h-10 w-10 transition-colors focus-ring",
              isRecording && "animate-pulse"
            )}
            onClick={() => isRecording ? stopRecording() : startRecording()}
            disabled={disabled}
            aria-label={isRecording ? "Parar gravação" : "Iniciar gravação"}
            title={isRecording ? "Parar gravação" : "Iniciar gravação"}
          >
            {isRecording ? <X className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        )}
      </div>
      
      {isRecording && (
        <div className="mt-2 flex items-center gap-2 p-2 bg-destructive/10 rounded-lg animate-fade-in">
          <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm text-destructive" id="typing-indicator">
            Gravando... {formatRecordingTime(recordingTime)}
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={stopRecording}
            className="focus-ring"
            aria-label="Cancelar gravação"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={stopRecording}
            className="focus-ring"
            aria-label="Enviar áudio"
          >
            Enviar
          </Button>
        </div>
      )}
    </div>
  );
}
