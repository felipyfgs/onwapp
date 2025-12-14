"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😊", "😍", "🥰", "😘",
  "😂", "🤣", "😎", "🤔", "😴", "🤗", "😇", "🙃",
  "👍", "👎", "👌", "✌️", "🤝", "🙏", "💪", "🎉",
  "❤️", "💔", "💯", "⭐", "🔥", "✨", "💥", "🎈",
] as const;

export function EmojiPicker({ onEmojiSelect, disabled }: EmojiPickerProps) {
  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
          disabled={disabled}
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              className="p-1.5 text-sm hover:bg-accent rounded transition-colors"
              onClick={() => handleEmojiSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
