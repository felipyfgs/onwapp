"use client"

import { useState } from "react"
import { Check, X, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EditableFieldProps {
  label: string
  value: string
  onSave: (value: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
  maxLength?: number
}

export function EditableField({
  label,
  value,
  onSave,
  placeholder,
  disabled = false,
  maxLength,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleEdit() {
    setInputValue(value)
    setEditing(true)
    setError(null)
  }

  function handleCancel() {
    setEditing(false)
    setInputValue(value)
    setError(null)
  }

  async function handleSave() {
    if (inputValue === value) {
      setEditing(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSave(inputValue)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={loading}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave()
              if (e.key === "Escape") handleCancel()
            }}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSave}
            disabled={loading}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm">
          {value || <span className="text-muted-foreground">{placeholder || "Not set"}</span>}
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleEdit}
          disabled={disabled}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
