"use client"

import { useEffect, useRef } from "react"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { Smile } from "lucide-react"
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
  const handleSelect = (emoji: { native: string }) => {
    onEmojiSelect(emoji.native)
  }

  return (
    <Popover>
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
        className="w-auto p-0 border-none shadow-xl"
        sideOffset={10}
      >
        <Picker
          data={data}
          onEmojiSelect={handleSelect}
          theme="light"
          locale="pt"
          previewPosition="none"
          skinTonePosition="search"
          maxFrequentRows={2}
          perLine={8}
          emojiSize={28}
          emojiButtonSize={36}
          categories={[
            "frequent",
            "people",
            "nature",
            "foods",
            "activity",
            "places",
            "objects",
            "symbols",
            "flags",
          ]}
          i18n={{
            search: "Pesquisar",
            search_no_results_1: "Nenhum emoji encontrado",
            pick: "Escolha um emoji",
            categories: {
              frequent: "Frequentes",
              people: "Pessoas",
              nature: "Natureza",
              foods: "Comidas",
              activity: "Atividades",
              places: "Viagens",
              objects: "Objetos",
              symbols: "Simbolos",
              flags: "Bandeiras",
            },
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
