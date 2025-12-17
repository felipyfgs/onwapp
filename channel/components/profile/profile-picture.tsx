"use client"

import { useRef, useState } from "react"
import { Camera, Loader2, Trash2, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setProfilePicture, deleteProfilePicture } from "@/lib/api/profile"

interface ProfilePictureProps {
  sessionId: string
  pictureUrl?: string
  name?: string
  onUpdate?: () => void
}

export function ProfilePicture({ sessionId, pictureUrl, name, onUpdate }: ProfilePictureProps) {
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?"

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1]
        await setProfilePicture(sessionId, base64)
        onUpdate?.()
        setLoading(false)
      }
      reader.onerror = () => {
        console.error("Failed to read file")
        setLoading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Failed to update profile picture:", err)
      setLoading(false)
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = async () => {
    try {
      setLoading(true)
      await deleteProfilePicture(sessionId)
      onUpdate?.()
    } catch (err) {
      console.error("Failed to remove profile picture:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-32 w-32">
          <AvatarImage src={pictureUrl} alt={name || "Profile"} />
          <AvatarFallback className="text-3xl bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-md"
              disabled={loading}
            >
              <Camera className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <User className="h-4 w-4 mr-2" />
              Upload Photo
            </DropdownMenuItem>
            {pictureUrl && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleRemove}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Photo
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
