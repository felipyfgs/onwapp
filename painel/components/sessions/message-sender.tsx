"use client"

import * as React from "react"
import {
  FileText,
  Image,
  Loader2,
  MapPin,
  Mic,
  Send,
  Video,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { MessageType } from "@/lib/types/message"
import {
  sendText,
  sendImage,
  sendDocument,
  sendAudio,
  sendVideo,
  sendLocation,
  sendContact,
} from "@/lib/api/messages"

interface MessageSenderProps {
  sessionId: string
}

export function MessageSender({ sessionId }: MessageSenderProps) {
  const [sending, setSending] = React.useState(false)
  const [messageType, setMessageType] = React.useState<MessageType>("text")

  // Common fields
  const [phone, setPhone] = React.useState("")

  // Text message
  const [message, setMessage] = React.useState("")

  // Media message
  const [mediaBase64, setMediaBase64] = React.useState("")
  const [caption, setCaption] = React.useState("")
  const [filename, setFilename] = React.useState("")

  // Location
  const [latitude, setLatitude] = React.useState("")
  const [longitude, setLongitude] = React.useState("")
  const [locationName, setLocationName] = React.useState("")
  const [address, setAddress] = React.useState("")

  // Contact
  const [contactName, setContactName] = React.useState("")
  const [contactPhone, setContactPhone] = React.useState("")

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 16 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 16MB)")
      return
    }

    setFilename(file.name)

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]
      setMediaBase64(base64)
    }
    reader.onerror = () => {
      toast.error("Erro ao ler arquivo")
    }
    reader.readAsDataURL(file)
  }

  const resetForm = () => {
    setMessage("")
    setMediaBase64("")
    setCaption("")
    setFilename("")
    setLatitude("")
    setLongitude("")
    setLocationName("")
    setAddress("")
    setContactName("")
    setContactPhone("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSend = async () => {
    const cleanPhone = phone.trim().replace(/\D/g, "")
    if (!cleanPhone) {
      toast.error("Informe o número de telefone")
      return
    }

    setSending(true)
    try {
      switch (messageType) {
        case "text":
          if (!message.trim()) {
            toast.error("Digite uma mensagem")
            return
          }
          await sendText(sessionId, { phone: cleanPhone, message: message.trim() })
          break

        case "image":
        case "document":
        case "audio":
        case "video":
          if (!mediaBase64) {
            toast.error("Selecione um arquivo")
            return
          }
          const mediaData = {
            phone: cleanPhone,
            media: mediaBase64,
            caption: caption.trim() || undefined,
            filename: filename || undefined,
          }
          if (messageType === "image") await sendImage(sessionId, mediaData)
          else if (messageType === "document") await sendDocument(sessionId, mediaData)
          else if (messageType === "audio") await sendAudio(sessionId, mediaData)
          else if (messageType === "video") await sendVideo(sessionId, mediaData)
          break

        case "location":
          if (!latitude || !longitude) {
            toast.error("Informe latitude e longitude")
            return
          }
          await sendLocation(sessionId, {
            phone: cleanPhone,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            name: locationName.trim() || undefined,
            address: address.trim() || undefined,
          })
          break

        case "contact":
          if (!contactName.trim() || !contactPhone.trim()) {
            toast.error("Informe nome e telefone do contato")
            return
          }
          await sendContact(sessionId, {
            phone: cleanPhone,
            contact: {
              name: contactName.trim(),
              phone: contactPhone.trim().replace(/\D/g, ""),
            },
          })
          break
      }

      toast.success("Mensagem enviada!")
      resetForm()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem")
    } finally {
      setSending(false)
    }
  }

  const getAcceptType = () => {
    switch (messageType) {
      case "image":
        return "image/*"
      case "audio":
        return "audio/*"
      case "video":
        return "video/*"
      default:
        return "*/*"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Enviar Mensagem</CardTitle>
        </div>
        <CardDescription>
          Envie mensagens de texto, mídia, localização ou contatos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phone Input */}
        <div className="space-y-2">
          <Label htmlFor="phone">Número de Telefone *</Label>
          <Input
            id="phone"
            placeholder="5511999999999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Número com código do país (ex: 5511999999999)
          </p>
        </div>

        {/* Message Type Tabs */}
        <Tabs
          value={messageType}
          onValueChange={(v) => {
            setMessageType(v as MessageType)
            resetForm()
          }}
        >
          <TabsList className="grid grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="text" className="gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Texto</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-1">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Imagem</span>
            </TabsTrigger>
            <TabsTrigger value="document" className="gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Doc</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="gap-1">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Áudio</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-1">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Vídeo</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="gap-1">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Local</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-1">
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">Contato</span>
            </TabsTrigger>
          </TabsList>

          {/* Text */}
          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem *</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          </TabsContent>

          {/* Image / Document / Audio / Video */}
          {["image", "document", "audio", "video"].map((type) => (
            <TabsContent key={type} value={type} className="space-y-4">
              <div className="space-y-2">
                <Label>Arquivo *</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept={getAcceptType()}
                  onChange={handleFileChange}
                />
                {filename && (
                  <p className="text-sm text-muted-foreground">
                    Selecionado: {filename}
                  </p>
                )}
              </div>
              {(type === "image" || type === "video") && (
                <div className="space-y-2">
                  <Label htmlFor="caption">Legenda (opcional)</Label>
                  <Input
                    id="caption"
                    placeholder="Adicione uma legenda..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>
              )}
            </TabsContent>
          ))}

          {/* Location */}
          <TabsContent value="location" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="-23.5505"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="-46.6333"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationName">Nome do Local (opcional)</Label>
              <Input
                id="locationName"
                placeholder="Ex: Shopping Center"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço (opcional)</Label>
              <Input
                id="address"
                placeholder="Ex: Av. Paulista, 1000"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </TabsContent>

          {/* Contact */}
          <TabsContent value="contact" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Nome do Contato *</Label>
              <Input
                id="contactName"
                placeholder="João Silva"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefone do Contato *</Label>
              <Input
                id="contactPhone"
                placeholder="5511999999999"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Send Button */}
        <Button onClick={handleSend} disabled={sending} className="w-full">
          {sending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Enviar Mensagem
        </Button>
      </CardContent>
    </Card>
  )
}
