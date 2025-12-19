"use client"

import { useState, useEffect } from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { QuickReply } from "@/lib/nats/nats-types"

interface QuickRepliesProps {
  replies: QuickReply[]
  inputValue: string
  onSelect: (message: string) => void
  children: React.ReactNode
}

export function QuickReplies({ replies, inputValue, onSelect, children }: QuickRepliesProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (inputValue.startsWith('/') && inputValue.length > 1) {
      setOpen(true)
      setSearch(inputValue.slice(1))
    } else {
      setOpen(false)
      setSearch("")
    }
  }, [inputValue])

  const filteredReplies = replies.filter(reply => 
    reply.shortcut.toLowerCase().includes(search.toLowerCase()) ||
    reply.message.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(reply: QuickReply) {
    onSelect(reply.message)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="start" 
        className="w-80 p-0 border-border bg-popover"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="bg-transparent">
          <CommandInput 
            placeholder="Buscar resposta rápida..." 
            value={search}
            onValueChange={setSearch}
            className="border-border"
          />
          <CommandList>
            <CommandEmpty className="text-muted-foreground text-sm py-6 text-center">
              Nenhuma resposta encontrada
            </CommandEmpty>
            <CommandGroup>
              {filteredReplies.map(reply => (
                <CommandItem
                  key={reply.id}
                  value={reply.shortcut}
                  onSelect={() => handleSelect(reply)}
                  className="text-popover-foreground hover:bg-accent cursor-pointer py-3"
                >
                  <div className="flex flex-col gap-1 w-full">
                    <span className="text-xs text-chart-2 font-medium">
                      /{reply.shortcut}
                    </span>
                    <span className="text-sm text-popover-foreground truncate">
                      {reply.message}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
