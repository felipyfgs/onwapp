"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { X, Send, Plus, FileText, FileSpreadsheet, FileImage, File, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export interface MediaFile {
  file: File
  preview: string
  type: "image" | "video" | "audio" | "document"
  caption: string
}

function getDocumentIcon(mimeType: string, fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return <FileText className="size-10 text-red-500" />
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || ext === 'xls' || ext === 'xlsx' || ext === 'csv') {
    return <FileSpreadsheet className="size-10 text-green-600" />
  }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint') || ext === 'ppt' || ext === 'pptx') {
    return <FileImage className="size-10 text-orange-500" />
  }
  if (mimeType.includes('word') || mimeType.includes('document') || ext === 'doc' || ext === 'docx') {
    return <FileText className="size-10 text-blue-600" />
  }
  return <File className="size-10 text-muted-foreground" />
}

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

interface MediaPreviewModalProps {
  files: MediaFile[]
  onFilesChange: (files: MediaFile[]) => void
  onSend: (files: MediaFile[]) => Promise<void>
  onClose: () => void
  disabled?: boolean
}

function getFileType(file: File): MediaFile["type"] {
  if (file.type.startsWith("image/")) return "image"
  if (file.type.startsWith("video/")) return "video"
  if (file.type.startsWith("audio/")) return "audio"
  return "document"
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export function MediaPreviewModal({
  files,
  onFilesChange,
  onSend,
  onClose,
  disabled,
}: MediaPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sending, setSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentFile = files[currentIndex]

  useEffect(() => {
    textareaRef.current?.focus()
  }, [currentIndex])

  const handleCaptionChange = (caption: string) => {
    const updated = [...files]
    updated[currentIndex] = { ...updated[currentIndex], caption }
    onFilesChange(updated)
  }

  const handleRemoveFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index)
    if (updated.length === 0) {
      onClose()
      return
    }
    onFilesChange(updated)
    if (currentIndex >= updated.length) {
      setCurrentIndex(updated.length - 1)
    }
  }

  const handleAddFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    
    const additions: MediaFile[] = Array.from(newFiles).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: getFileType(file),
      caption: "",
    }))
    
    onFilesChange([...files, ...additions])
  }

  const handleSend = async () => {
    if (sending || disabled) return
    setSending(true)
    try {
      await onSend(files)
      onClose()
    } catch (err) {
      console.error("Erro ao enviar arquivos:", err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const goToPrev = () => setCurrentIndex((i) => Math.max(0, i - 1))
  const goToNext = () => setCurrentIndex((i) => Math.min(files.length - 1, i + 1))

  return (
    <div className="absolute inset-0 z-50 bg-background/95 flex flex-col" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-5" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {files.length > 1 && `${currentIndex + 1} de ${files.length}`}
        </span>
        <div className="w-10" />
      </div>

      {/* Preview area */}
      <div className={cn(
        "flex-1 flex items-center justify-center relative min-h-0 overflow-hidden",
        currentFile?.type === "document" && isPdfFile(currentFile.file) ? "p-0" : "p-2"
      )}>
        {files.length > 1 && currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 z-10"
            onClick={goToPrev}
          >
            <ChevronLeft className="size-6" />
          </Button>
        )}

        <div className={cn(
          "flex items-center justify-center overflow-hidden",
          currentFile?.type === "document" && isPdfFile(currentFile.file) 
            ? "w-full h-full" 
            : "max-w-full max-h-full"
        )}>
          {currentFile?.type === "image" && (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={currentFile.preview}
                alt="Preview"
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain rounded-lg w-auto h-auto"
                unoptimized
              />
            </div>
          )}
          {currentFile?.type === "video" && (
            <video
              src={currentFile.preview}
              controls
              className="max-w-full max-h-full rounded-lg"
            />
          )}
          {currentFile?.type === "audio" && (
            <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg">
              <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center">
                <svg className="size-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <audio src={currentFile.preview} controls className="w-56" />
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{currentFile.file.name}</p>
            </div>
          )}
          {currentFile?.type === "document" && isPdfFile(currentFile.file) && (
            <iframe
              src={currentFile.preview}
              className="w-full h-full border-0 rounded-lg"
              title={currentFile.file.name}
            />
          )}
          {currentFile?.type === "document" && !isPdfFile(currentFile.file) && (
            <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg">
              <div className="size-20 rounded-lg bg-muted flex items-center justify-center">
                {getDocumentIcon(currentFile.file.type, currentFile.file.name)}
              </div>
              <div className="text-center">
                <p className="font-medium text-sm truncate max-w-[200px]">{currentFile.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(currentFile.file.size)}
                </p>
              </div>
            </div>
          )}
        </div>

        {files.length > 1 && currentIndex < files.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 z-10"
            onClick={goToNext}
          >
            <ChevronRight className="size-6" />
          </Button>
        )}
      </div>

      {/* Thumbnails */}
      {files.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 px-3 py-2 border-t overflow-x-auto shrink-0">
          {files.map((f, i) => (
            <div
              key={i}
              className={cn(
                "relative shrink-0 size-12 rounded-md overflow-hidden cursor-pointer border-2 transition-colors",
                i === currentIndex ? "border-primary" : "border-transparent hover:border-muted-foreground/50"
              )}
              onClick={() => setCurrentIndex(i)}
            >
              {f.type === "image" && (
                <Image src={f.preview} alt="Thumbnail" fill className="object-cover" unoptimized />
              )}
              {f.type === "video" && (
                <video src={f.preview} className="w-full h-full object-cover" />
              )}
              {f.type === "audio" && (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <svg className="size-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
              )}
              {f.type === "document" && (
                <div className="w-full h-full bg-muted flex items-center justify-center scale-50">
                  {getDocumentIcon(f.file.type, f.file.name)}
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveFile(i)
                }}
                className="absolute top-0.5 right-0.5 size-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 size-12 rounded-md border-2 border-dashed border-muted-foreground/50 flex items-center justify-center hover:border-primary hover:bg-muted/50 transition-colors"
          >
            <Plus className="size-5 text-muted-foreground" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden"
            onChange={(e) => handleAddFiles(e.target.files)}
          />
        </div>
      )}

      {/* Caption input */}
      <div className="flex items-end gap-2 p-3 border-t shrink-0">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={currentFile?.caption || ""}
            onChange={(e) => handleCaptionChange(e.target.value)}
            placeholder="Adicionar legenda..."
            disabled={disabled || sending}
            className="min-h-[40px] max-h-[80px] resize-none py-2.5 pr-4 rounded-lg bg-muted border-0 text-sm"
            rows={1}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={sending || disabled}
          size="icon"
          className="shrink-0 size-10 rounded-full bg-primary hover:bg-primary/90"
        >
          {sending ? (
            <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export function createMediaFiles(fileList: FileList | File[]): MediaFile[] {
  const files = Array.isArray(fileList) ? fileList : Array.from(fileList)
  return files.map((file) => ({
    file,
    preview: URL.createObjectURL(file),
    type: getFileType(file),
    caption: "",
  }))
}
