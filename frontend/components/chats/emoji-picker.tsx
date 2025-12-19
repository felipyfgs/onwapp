"use client"

import { Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Picker from "@emoji-mart/react"
import data from "@emoji-mart/data"

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  disabled?: boolean
}

interface EmojiData {
  native: string
}

export function EmojiPicker({ onEmojiSelect, disabled = false }: EmojiPickerProps) {
  function handleSelect(emoji: EmojiData) {
    onEmojiSelect(emoji.native)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={disabled}
          className="h-9 w-9 shrink-0"
        >
          <Smile className="h-5 w-5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="start" 
        className="w-auto p-0 border-border bg-popover"
      >
        <Picker 
          data={data}
          onEmojiSelect={handleSelect}
          theme="auto"
          locale="pt"
          previewPosition="none"
          skinTonePosition="search"
        />
      </PopoverContent>
    </Popover>
  )
}
