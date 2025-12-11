"use client";

import { useEffect, useState, useCallback } from "react";
import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, StatsCard } from "@/components/common";
import { getMediaList, getSessions, Media, Session } from "@/lib/api";
import { Image, FileText, Mic, Video, File, RefreshCw, Download } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export default function MediaPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessions()
      .then((data) => {
        const connected = Array.isArray(data) ? data.filter((s) => s.status === "connected") : [];
        setSessions(connected);
        if (connected.length > 0) {
          setSelectedSession(connected[0].session);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchMedia = useCallback(async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const data = await getMediaList(selectedSession, 100);
      setMedia(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch media:", error);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedSession) {
      fetchMedia();
    }
  }, [selectedSession, fetchMedia]);

  const getMediaIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "image": return Image;
      case "video": return Video;
      case "audio": return Mic;
      case "document": return FileText;
      default: return File;
    }
  };

  const getMediaUrl = (m: Media) => {
    return `${API_URL}/${selectedSession}/media/stream?id=${m.id}&auth=${API_KEY}`;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const images = media.filter((m) => m.type === "image");
  const videos = media.filter((m) => m.type === "video");
  const audios = media.filter((m) => m.type === "audio");
  const documents = media.filter((m) => m.type === "document" || !["image", "video", "audio"].includes(m.type));

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader breadcrumbs={[{ label: "Media" }]} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Toolbar */}
          <div className="flex gap-4">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.session} value={s.session}>
                    {s.pushName || s.session}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchMedia}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatsCard title="Images" value={images.length} icon={Image} variant="chart1" />
            <StatsCard title="Videos" value={videos.length} icon={Video} variant="chart2" />
            <StatsCard title="Audio" value={audios.length} icon={Mic} variant="primary" />
            <StatsCard title="Documents" value={documents.length} icon={FileText} variant="chart4" />
          </div>

          {/* Media Grid */}
          {!selectedSession ? (
            <div className="rounded-xl border bg-muted/50 p-12 text-center">
              <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Select a session</h3>
              <p className="text-muted-foreground">Choose a connected session to view media</p>
            </div>
          ) : loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="rounded-xl border bg-muted/50 p-12 text-center">
              <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No media found</h3>
              <p className="text-muted-foreground">No media files in this session</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {media.map((m) => {
                const Icon = getMediaIcon(m.type);
                const isImage = m.type === "image";
                return (
                  <div
                    key={m.id}
                    className="group relative rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {isImage ? (
                      <div className="aspect-square bg-muted">
                        <img
                          src={getMediaUrl(m)}
                          alt={m.fileName || "Media"}
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
                      <p className="font-medium text-sm truncate">{m.fileName || `${m.type}_${m.id.slice(0, 8)}`}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>{formatSize(m.fileSize)}</span>
                        <span>{formatDate(m.createdAt)}</span>
                      </div>
                    </div>
                    <a
                      href={getMediaUrl(m)}
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
              })}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
