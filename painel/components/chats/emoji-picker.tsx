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
        className="w-[352px] p-0 shadow-xl border-0"
        sideOffset={10}
      >
        <FrimousseEmojiPicker.Root
          onEmojiSelect={(emoji) => {
            onEmojiSelect(emoji.emoji)
          }}
          className="flex h-[350px] w-full flex-col bg-popover rounded-lg overflow-hidden"
        >
          <FrimousseEmojiPicker.Search
            placeholder="Pesquisar emoji..."
            className="mx-2 mt-2 flex h-9 w-auto rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <FrimousseEmojiPicker.Viewport className="flex-1 overflow-y-auto p-2">
            <FrimousseEmojiPicker.Loading className="flex h-full items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </FrimousseEmojiPicker.Loading>
            <FrimousseEmojiPicker.Empty className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Nenhum emoji encontrado
            </FrimousseEmojiPicker.Empty>
            <FrimousseEmojiPicker.List
              className="select-none"
              components={{
                CategoryHeader: ({ category, ...props }) => (
                  <div
                    className="px-1 py-2 text-xs font-medium text-muted-foreground sticky top-0 bg-popover"
                    {...props}
                  >
                    {getCategoryLabel(category)}
                  </div>
                ),
                Row: ({ children, ...props }) => (
                  <div className="flex gap-0.5" {...props}>
                    {children}
                  </div>
                ),
                Emoji: ({ emoji, ...props }) => (
                  <button
                    className="flex size-8 items-center justify-center rounded text-xl hover:bg-muted transition-colors"
                    {...props}
                  >
                    {emoji.emoji}
                  </button>
                ),
              }}
            />
          </FrimousseEmojiPicker.Viewport>
          <div className="flex items-center gap-1 border-t p-1.5">
            <FrimousseEmojiPicker.SkinTonePicker className="flex gap-0.5">
              {["default", "light", "medium-light", "medium", "medium-dark", "dark"].map((tone) => (
                <FrimousseEmojiPicker.SkinTone
                  key={tone}
                  skinTone={tone as any}
                  className="size-5 rounded-full data-[active]:ring-2 data-[active]:ring-primary data-[active]:ring-offset-1"
                  style={{
                    backgroundColor: getSkinToneColor(tone),
                  }}
                />
              ))}
            </FrimousseEmojiPicker.SkinTonePicker>
          </div>
        </FrimousseEmojiPicker.Root>
      </PopoverContent>
    </Popover>
  )
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    "smileys-emotion": "Smileys e Emocoes",
    "people-body": "Pessoas",
    "animals-nature": "Animais e Natureza",
    "food-drink": "Comida e Bebida",
    "travel-places": "Viagens e Lugares",
    "activities": "Atividades",
    "objects": "Objetos",
    "symbols": "Simbolos",
    "flags": "Bandeiras",
    "frequent": "Frequentes",
  }
  return labels[category] || category
}

function getSkinToneColor(tone: string): string {
  const colors: Record<string, string> = {
    default: "#ffc83d",
    light: "#ffdbb4",
    "medium-light": "#eac086",
    medium: "#d08b5b",
    "medium-dark": "#ae7242",
    dark: "#614335",
  }
  return colors[tone] || "#ffc83d"
}
