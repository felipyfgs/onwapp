"use client";

import { Media } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Image, FileText, Mic, Video, File, Download } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface MediaCardProps {
  media: Media;
  mediaUrl: string;
}

const mediaIcons: Record<string, LucideIcon> = {
  image: Image,
  video: Video,
  audio: Mic,
  document: FileText,
};

function formatSize(bytes?: number): string {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MediaCard({ media, mediaUrl }: MediaCardProps) {
  const Icon = mediaIcons[media.type] || File;
  const isImage = media.type === "image";

  return (
    <div className="group relative rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-shadow">
      {isImage ? (
        <div className="aspect-square bg-muted">
          <img
            src={mediaUrl}
            alt={media.fileName || "Media"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-square bg-muted flex items-center justify-center">
          <Icon className="h-16 w-16 text-muted-foreground" />
        </div>
      )}
      <div className="p-3">
        <p className="font-medium text-sm truncate">
          {media.fileName || `${media.type}_${media.id.slice(0, 8)}`}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          <span>{formatSize(media.fileSize)}</span>
          <span>{formatDate(media.createdAt)}</span>
        </div>
      </div>
      <a
        href={mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Button size="icon" variant="secondary" className="h-8 w-8">
          <Download className="h-4 w-4" />
        </Button>
      </a>
    </div>
  );
}
