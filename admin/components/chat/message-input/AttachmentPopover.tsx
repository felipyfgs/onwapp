"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Paperclip, Image, File, Video, Camera } from "lucide-react";

type MediaType = "image" | "video" | "document";

interface AttachmentOption {
  id: MediaType;
  label: string;
  icon: typeof File;
  iconColor: string;
  bgColor: string;
  darkBgColor: string;
}

interface AttachmentPopoverProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const ATTACHMENT_OPTIONS: AttachmentOption[] = [
  {
    id: "document",
    label: "Arquivo",
    icon: File,
    iconColor: "",
    bgColor: "bg-slate-100",
    darkBgColor: "dark:bg-slate-800",
  },
  {
    id: "image",
    label: "Imagem",
    icon: Image,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100",
    darkBgColor: "dark:bg-blue-900/30",
  },
  {
    id: "video",
    label: "Vídeo",
    icon: Video,
    iconColor: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100",
    darkBgColor: "dark:bg-purple-900/30",
  },
  {
    id: "image",
    label: "Câmera",
    icon: Camera,
    iconColor: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100",
    darkBgColor: "dark:bg-red-900/30",
  },
];

export function AttachmentPopover({ onFileSelect, disabled }: AttachmentPopoverProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <div className="grid grid-cols-4 gap-1">
          {ATTACHMENT_OPTIONS.map((option) => (
            <button
              key={`${option.id}-${option.label}`}
              className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-accent transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={`p-1.5 rounded-lg ${option.bgColor} ${option.darkBgColor}`}>
                <option.icon className={`h-3.5 w-3.5 ${option.iconColor}`} />
              </div>
              <span className="text-xs">{option.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,video/*,application/*"
      />
    </Popover>
  );
}
