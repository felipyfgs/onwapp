"use client"

import { useRef, useEffect } from "react"
import { Message } from "@/lib/nats/nats-types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./message-bubble"
import { format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"

interface MessageListProps {
  messages: Message[]
  hasChat: boolean
}

export function MessageList({ messages, hasChat }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])
  
  if (!hasChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-secondary/30">
        <div className="text-center max-w-md px-6">
          <div className="bg-secondary w-64 h-64 rounded-full mx-auto mb-8 flex items-center justify-center">
             <span className="text-8xl opacity-20">💬</span>
          </div>
          <h2 className="text-3xl font-light text-foreground/60 mb-4">WhatsApp Web</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Envie e receba mensagens sem precisar manter seu celular conectado.<br/>
            Use o WhatsApp em até 4 dispositivos conectados e 1 celular ao mesmo tempo.
          </p>
        </div>
        <div className="mt-auto py-8 text-xs text-muted-foreground flex items-center gap-1">
          <span className="text-lg">🔒</span> Criptografia de ponta a ponta
        </div>
      </div>
    )
  }

  return (
    <ScrollArea ref={scrollRef} className="flex-1 bg-muted/20 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e71aaddda139628a134847728.png')] bg-repeat invert dark:invert-0" />
      
      <div className="relative z-10 py-6 flex flex-col min-h-full">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
             <div className="bg-chart-4/20 px-4 py-2 rounded-lg shadow-sm text-[12.5px] text-foreground/70 text-center max-w-xs border border-chart-4/10">
                As mensagens são protegidas com criptografia de ponta a ponta.
             </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1]
              const showDate = !prevMessage || !isSameDay(message.timestamp, prevMessage.timestamp)
              const isLastFromSender = !messages[index + 1] || messages[index + 1].sender !== message.sender

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <div className="bg-background/90 px-3 py-1.5 rounded-md shadow-sm text-[11px] font-medium text-muted-foreground uppercase tracking-wider border border-border/50">
                        {format(message.timestamp, "d 'de' MMMM", { locale: ptBR })}
                      </div>
                    </div>
                  )}
                  <MessageBubble 
                    message={message} 
                    isLastFromSender={isLastFromSender}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
