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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="border-t bg-background p-3 shrink-0">
      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0" disabled={disabled}>
              <Paperclip className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="grid grid-cols-3 gap-1">
              <button
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs">Document</span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs">Image</span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="h-10 w-10 rounded-full bg-pink-500 flex items-center justify-center">
                  <Video className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs">Video</span>
              </button>
              <button className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors">
                <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs">Camera</span>
              </button>
              <button className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors">
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs">Location</span>
              </button>
              <button className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors">
                <div className="h-10 w-10 rounded-full bg-cyan-500 flex items-center justify-center">
                  <Contact className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs">Contact</span>
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
            <Button variant="ghost" size="icon" className="shrink-0" disabled={disabled}>
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  className="p-2 text-xl hover:bg-accent rounded transition-colors"
                  onClick={() => insertEmoji(emoji)}
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
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-10 max-h-32 resize-none pr-4"
            rows={1}
          />
        </div>

        {/* Send / Record Button */}
        {message.trim() ? (
          <Button 
            size="icon" 
            className="shrink-0 h-10 w-10"
            onClick={handleSend}
            disabled={disabled}
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="icon"
            className="shrink-0 h-10 w-10"
            onClick={() => setIsRecording(!isRecording)}
            disabled={disabled}
          >
            {isRecording ? <X className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        )}
      </div>
      
      {isRecording && (
        <div className="mt-2 flex items-center gap-2 p-2 bg-destructive/10 rounded-lg">
          <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm text-destructive">Recording... 0:00</span>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" onClick={() => setIsRecording(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => setIsRecording(false)}>
            Send
          </Button>
        </div>
      )}
    </div>
  );
}
