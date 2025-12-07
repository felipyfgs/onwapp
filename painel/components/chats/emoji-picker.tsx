"use client"

import { useState } from "react"
import { EmojiPicker as FrimousseEmojiPicker } from "frimousse"
import { Smile, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  disabled?: boolean
}

const categoryLabels: Record<string, string> = {
  "smileys-emotion": "Smileys e Emocoes",
  "Smileys & emotion": "Smileys e Emocoes",
  "people-body": "Pessoas",
  "People & body": "Pessoas",
  "animals-nature": "Animais e Natureza",
  "Animals & nature": "Animais e Natureza",
  "food-drink": "Comida e Bebida",
  "Food & drink": "Comida e Bebida",
  "travel-places": "Viagens e Lugares",
  "Travel & places": "Viagens e Lugares",
  "activities": "Atividades",
  "Activities": "Atividades",
  "objects": "Objetos",
  "Objects": "Objetos",
  "symbols": "Simbolos",
  "Symbols": "Simbolos",
  "flags": "Bandeiras",
  "Flags": "Bandeiras",
  "frequent": "Frequentes",
}

export function EmojiPicker({ onEmojiSelect, disabled }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          <Smile className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="start" 
        className="w-fit p-0 shadow-xl"
        sideOffset={10}
      >
        <FrimousseEmojiPicker.Root
          onEmojiSelect={(emoji) => {
            onEmojiSelect(emoji.emoji)
          }}
          className="isolate flex h-[368px] w-fit flex-col bg-popover rounded-lg"
        >
          <FrimousseEmojiPicker.Search
            placeholder="Pesquisar emoji..."
            className="z-10 mx-2 mt-2 appearance-none rounded-md bg-muted px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <FrimousseEmojiPicker.Viewport className="relative flex-1 outline-hidden">
            <FrimousseEmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="size-5 animate-spin" />
            </FrimousseEmojiPicker.Loading>
            <FrimousseEmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Nenhum emoji encontrado
            </FrimousseEmojiPicker.Empty>
            <FrimousseEmojiPicker.List
              className="select-none pb-1.5"
              components={{
                CategoryHeader: ({ category, ...props }) => (
                  <div
                    className="bg-popover px-3 pt-3 pb-1.5 font-medium text-muted-foreground text-xs"
                    {...props}
                  >
                    {categoryLabels[category.label] || category.label}
                  </div>
                ),
                Row: ({ children, ...props }) => (
                  <div className="scroll-my-1.5 px-1.5" {...props}>
                    {children}
                  </div>
                ),
                Emoji: ({ emoji, ...props }) => (
                  <button
                    className="flex size-8 items-center justify-center rounded-md text-lg data-[active]:bg-muted"
                    {...props}
                  >
                    {emoji.emoji}
                  </button>
                ),
              }}
            />
          </FrimousseEmojiPicker.Viewport>
        </FrimousseEmojiPicker.Root>
      </PopoverContent>
    </Popover>
  )
}


