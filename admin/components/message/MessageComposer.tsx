"use client";

import { useState } from "react";
import { sendTextMessage, sendImageMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Send, Image, FileText, MapPin, Mic, Video, CheckCircle, AlertCircle } from "lucide-react";

type MessageType = "text" | "image" | "audio" | "video" | "document" | "location";

interface MessageComposerProps {
  sessionId: string;
  defaultRecipient?: string;
}

const messageTypes = [
  { value: "text", label: "Text", icon: FileText },
  { value: "image", label: "Image", icon: Image },
  { value: "audio", label: "Audio", icon: Mic },
  { value: "video", label: "Video", icon: Video },
  { value: "document", label: "Document", icon: FileText },
  { value: "location", label: "Location", icon: MapPin },
] as const;

export function MessageComposer({ sessionId, defaultRecipient = "" }: MessageComposerProps) {
  const [messageType, setMessageType] = useState<MessageType>("text");
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [textMessage, setTextMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSend = async () => {
    if (!sessionId || !recipient) {
      setResult({ success: false, message: "Enter recipient" });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      switch (messageType) {
        case "text":
          if (!textMessage) throw new Error("Enter a message");
          await sendTextMessage(sessionId, { to: recipient, text: textMessage });
          break;
        case "image":
          if (!mediaUrl) throw new Error("Enter image URL");
          await sendImageMessage(sessionId, { to: recipient, url: mediaUrl, caption });
          break;
        default:
          throw new Error("Message type not implemented yet");
      }
      setResult({ success: true, message: "Message sent successfully!" });
      setTextMessage("");
      setMediaUrl("");
      setCaption("");
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : "Failed to send" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Message</CardTitle>
        <CardDescription>Send WhatsApp messages through your connected sessions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recipient */}
        <div className="space-y-2">
          <Label>Recipient (JID or Phone)</Label>
          <Input
            placeholder="5511999999999 or 5511999999999@s.whatsapp.net"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </div>

        {/* Message Type */}
        <div className="space-y-2">
          <Label>Message Type</Label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {messageTypes.map((type) => (
              <Button
                key={type.value}
                variant={messageType === type.value ? "default" : "outline"}
                size="sm"
                className="flex flex-col h-16 gap-1"
                onClick={() => setMessageType(type.value)}
              >
                <type.icon className="h-4 w-4" />
                <span className="text-xs">{type.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Message Content */}
        {messageType === "text" && (
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Type your message..."
              value={textMessage}
              onChange={(e) => setTextMessage(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {(messageType === "image" || messageType === "video" || messageType === "audio" || messageType === "document") && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Media URL</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>
            {(messageType === "image" || messageType === "video") && (
              <div className="space-y-2">
                <Label>Caption (optional)</Label>
                <Input
                  placeholder="Image caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {messageType === "location" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input
                placeholder="-23.5505"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input
                placeholder="-46.6333"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`flex items-center gap-2 p-4 rounded-lg ${result.success ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"}`}>
            {result.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span>{result.message}</span>
          </div>
        )}

        {/* Send Button */}
        <Button onClick={handleSend} disabled={sending || !sessionId} className="w-full">
          <Send className="mr-2 h-4 w-4" />
          {sending ? "Sending..." : "Send Message"}
        </Button>
      </CardContent>
    </Card>
  );
}
