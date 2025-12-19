"use client"

import { useRef } from "react"
import { Paperclip, Image as ImageIcon, FileText, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AttachmentButtonProps {
  onFileSelect: (file: File, type: 'image' | 'document') => void
  disabled?: boolean
}

export function AttachmentButton({ onFileSelect, disabled = false }: AttachmentButtonProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file, 'image')
    }
    e.target.value = ''
  }

  function handleDocumentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file, 'document')
    }
    e.target.value = ''
  }

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
        onChange={handleDocumentChange}
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            disabled={disabled}
            className="h-9 w-9 shrink-0"
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          side="top" 
          align="start" 
          className="w-48 bg-popover border-border"
        >
          <DropdownMenuItem 
            onClick={() => imageInputRef.current?.click()}
            className="text-popover-foreground hover:bg-accent cursor-pointer"
          >
            <ImageIcon className="h-4 w-4 mr-2 text-chart-2" />
            Imagem
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => documentInputRef.current?.click()}
            className="text-popover-foreground hover:bg-accent cursor-pointer"
          >
            <FileText className="h-4 w-4 mr-2 text-chart-1" />
            Documento
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => imageInputRef.current?.click()}
            className="text-popover-foreground hover:bg-accent cursor-pointer"
          >
            <Camera className="h-4 w-4 mr-2 text-chart-5" />
            Câmera
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
