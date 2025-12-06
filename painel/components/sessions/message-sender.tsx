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
  Sticker,
  BarChart3,
  MousePointerClick,
  List,
  LayoutTemplate,
  Plus,
  Trash2,
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
import { Switch } from "@/components/ui/switch"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

import type { 
  MessageType,
  ButtonDTO,
  ListSectionDTO,
  ListRowDTO,
  TemplateButtonDTO,
} from "@/lib/types/message"
import {
  sendText,
  sendImage,
  sendDocument,
  sendAudio,
  sendVideo,
  sendSticker,
  sendLocation,
  sendContact,
  sendPoll,
  sendButtons,
  sendList,
  sendTemplate,
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

  // Audio specific
  const [ptt, setPtt] = React.useState(true)

  // Location
  const [latitude, setLatitude] = React.useState("")
  const [longitude, setLongitude] = React.useState("")
  const [locationName, setLocationName] = React.useState("")
  const [address, setAddress] = React.useState("")

  // Contact
  const [contactName, setContactName] = React.useState("")
  const [contactPhone, setContactPhone] = React.useState("")

  // Poll
  const [pollName, setPollName] = React.useState("")
  const [pollOptions, setPollOptions] = React.useState<string[]>(["", ""])
  const [selectableCount, setSelectableCount] = React.useState(1)

  // Buttons
  const [headerText, setHeaderText] = React.useState("")
  const [contentText, setContentText] = React.useState("")
  const [footerText, setFooterText] = React.useState("")
  const [buttons, setButtons] = React.useState<ButtonDTO[]>([
    { buttonId: "btn1", displayText: "" }
  ])

  // List
  const [listTitle, setListTitle] = React.useState("")
  const [listDescription, setListDescription] = React.useState("")
  const [listButtonText, setListButtonText] = React.useState("")
  const [sections, setSections] = React.useState<ListSectionDTO[]>([
    { title: "", rows: [{ title: "", description: "", rowId: "row1" }] }
  ])

  // Template
  const [templateTitle, setTemplateTitle] = React.useState("")
  const [templateContent, setTemplateContent] = React.useState("")
  const [templateFooter, setTemplateFooter] = React.useState("")
  const [templateButtons, setTemplateButtons] = React.useState<TemplateButtonDTO[]>([
    { index: 0, quickReply: { displayText: "", id: "btn1" } }
  ])

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
    setPtt(true)
    setLatitude("")
    setLongitude("")
    setLocationName("")
    setAddress("")
    setContactName("")
    setContactPhone("")
    setPollName("")
    setPollOptions(["", ""])
    setSelectableCount(1)
    setHeaderText("")
    setContentText("")
    setFooterText("")
    setButtons([{ buttonId: "btn1", displayText: "" }])
    setListTitle("")
    setListDescription("")
    setListButtonText("")
    setSections([{ title: "", rows: [{ title: "", description: "", rowId: "row1" }] }])
    setTemplateTitle("")
    setTemplateContent("")
    setTemplateFooter("")
    setTemplateButtons([{ index: 0, quickReply: { displayText: "", id: "btn1" } }])
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
            setSending(false)
            return
          }
          await sendText(sessionId, { phone: cleanPhone, text: message.trim() })
          break

        case "image":
          if (!mediaBase64) {
            toast.error("Selecione uma imagem")
            setSending(false)
            return
          }
          await sendImage(sessionId, {
            phone: cleanPhone,
            image: mediaBase64,
            caption: caption.trim() || undefined,
          })
          break

        case "document":
          if (!mediaBase64 || !filename) {
            toast.error("Selecione um documento")
            setSending(false)
            return
          }
          await sendDocument(sessionId, {
            phone: cleanPhone,
            document: mediaBase64,
            filename: filename,
          })
          break

        case "audio":
          if (!mediaBase64) {
            toast.error("Selecione um áudio")
            setSending(false)
            return
          }
          await sendAudio(sessionId, {
            phone: cleanPhone,
            audio: mediaBase64,
            ptt: ptt,
          })
          break

        case "video":
          if (!mediaBase64) {
            toast.error("Selecione um vídeo")
            setSending(false)
            return
          }
          await sendVideo(sessionId, {
            phone: cleanPhone,
            video: mediaBase64,
            caption: caption.trim() || undefined,
          })
          break

        case "sticker":
          if (!mediaBase64) {
            toast.error("Selecione uma figurinha")
            setSending(false)
            return
          }
          await sendSticker(sessionId, {
            phone: cleanPhone,
            sticker: mediaBase64,
          })
          break

        case "location":
          if (!latitude || !longitude) {
            toast.error("Informe latitude e longitude")
            setSending(false)
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
            setSending(false)
            return
          }
          await sendContact(sessionId, {
            phone: cleanPhone,
            contactName: contactName.trim(),
            contactPhone: contactPhone.trim().replace(/\D/g, ""),
          })
          break

        case "poll":
          if (!pollName.trim()) {
            toast.error("Informe a pergunta da enquete")
            setSending(false)
            return
          }
          const validOptions = pollOptions.filter(o => o.trim())
          if (validOptions.length < 2) {
            toast.error("Informe pelo menos 2 opções")
            setSending(false)
            return
          }
          await sendPoll(sessionId, {
            phone: cleanPhone,
            name: pollName.trim(),
            options: validOptions,
            selectableCount: selectableCount,
          })
          break

        case "buttons":
          if (!contentText.trim()) {
            toast.error("Informe o texto do conteúdo")
            setSending(false)
            return
          }
          const validButtons = buttons.filter(b => b.displayText.trim())
          if (validButtons.length === 0) {
            toast.error("Adicione pelo menos um botão")
            setSending(false)
            return
          }
          await sendButtons(sessionId, {
            phone: cleanPhone,
            contentText: contentText.trim(),
            headerText: headerText.trim() || undefined,
            footerText: footerText.trim() || undefined,
            buttons: validButtons.map((b, i) => ({
              buttonId: b.buttonId || `btn${i + 1}`,
              displayText: b.displayText.trim(),
            })),
          })
          break

        case "list":
          if (!listTitle.trim() || !listDescription.trim() || !listButtonText.trim()) {
            toast.error("Preencha título, descrição e texto do botão")
            setSending(false)
            return
          }
          const validSections = sections
            .map(s => ({
              ...s,
              rows: s.rows.filter(r => r.title.trim()),
            }))
            .filter(s => s.title.trim() && s.rows.length > 0)
          if (validSections.length === 0) {
            toast.error("Adicione pelo menos uma seção com itens")
            setSending(false)
            return
          }
          await sendList(sessionId, {
            phone: cleanPhone,
            title: listTitle.trim(),
            description: listDescription.trim(),
            buttonText: listButtonText.trim(),
            footerText: footerText.trim() || undefined,
            sections: validSections.map(s => ({
              title: s.title.trim(),
              rows: s.rows.map((r, i) => ({
                title: r.title.trim(),
                description: r.description?.trim() || undefined,
                rowId: r.rowId || `row${i + 1}`,
              })),
            })),
          })
          break

        case "template":
          if (!templateContent.trim()) {
            toast.error("Informe o conteúdo do template")
            setSending(false)
            return
          }
          const validTemplateButtons = templateButtons.filter(
            b => b.quickReply?.displayText?.trim() || b.urlButton?.displayText?.trim() || b.callButton?.displayText?.trim()
          )
          if (validTemplateButtons.length === 0) {
            toast.error("Adicione pelo menos um botão")
            setSending(false)
            return
          }
          await sendTemplate(sessionId, {
            phone: cleanPhone,
            title: templateTitle.trim() || undefined,
            content: templateContent.trim(),
            footer: templateFooter.trim() || undefined,
            buttons: validTemplateButtons,
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
      case "sticker":
        return "image/webp,image/png"
      default:
        return "*/*"
    }
  }

  // Poll helpers
  const addPollOption = () => {
    if (pollOptions.length < 12) {
      setPollOptions([...pollOptions, ""])
    }
  }

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index))
    }
  }

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
  }

  // Button helpers
  const addButton = () => {
    if (buttons.length < 3) {
      setButtons([...buttons, { buttonId: `btn${buttons.length + 1}`, displayText: "" }])
    }
  }

  const removeButton = (index: number) => {
    if (buttons.length > 1) {
      setButtons(buttons.filter((_, i) => i !== index))
    }
  }

  const updateButton = (index: number, displayText: string) => {
    const newButtons = [...buttons]
    newButtons[index] = { ...newButtons[index], displayText }
    setButtons(newButtons)
  }

  // Section helpers
  const addSection = () => {
    setSections([...sections, { title: "", rows: [{ title: "", description: "", rowId: `row${Date.now()}` }] }])
  }

  const removeSection = (index: number) => {
    if (sections.length > 1) {
      setSections(sections.filter((_, i) => i !== index))
    }
  }

  const updateSectionTitle = (index: number, title: string) => {
    const newSections = [...sections]
    newSections[index] = { ...newSections[index], title }
    setSections(newSections)
  }

  const addRow = (sectionIndex: number) => {
    const newSections = [...sections]
    newSections[sectionIndex].rows.push({ title: "", description: "", rowId: `row${Date.now()}` })
    setSections(newSections)
  }

  const removeRow = (sectionIndex: number, rowIndex: number) => {
    const newSections = [...sections]
    if (newSections[sectionIndex].rows.length > 1) {
      newSections[sectionIndex].rows = newSections[sectionIndex].rows.filter((_, i) => i !== rowIndex)
      setSections(newSections)
    }
  }

  const updateRow = (sectionIndex: number, rowIndex: number, field: "title" | "description", value: string) => {
    const newSections = [...sections]
    newSections[sectionIndex].rows[rowIndex] = {
      ...newSections[sectionIndex].rows[rowIndex],
      [field]: value,
    }
    setSections(newSections)
  }

  // Template button helpers
  const addTemplateButton = (type: "quickReply" | "urlButton" | "callButton") => {
    if (templateButtons.length < 3) {
      const index = templateButtons.length
      let newButton: TemplateButtonDTO = { index }
      if (type === "quickReply") {
        newButton.quickReply = { displayText: "", id: `btn${index + 1}` }
      } else if (type === "urlButton") {
        newButton.urlButton = { displayText: "", url: "" }
      } else {
        newButton.callButton = { displayText: "", phoneNumber: "" }
      }
      setTemplateButtons([...templateButtons, newButton])
    }
  }

  const removeTemplateButton = (index: number) => {
    if (templateButtons.length > 1) {
      setTemplateButtons(templateButtons.filter((_, i) => i !== index))
    }
  }

  const updateTemplateButton = (index: number, field: string, value: string) => {
    const newButtons = [...templateButtons]
    const btn = newButtons[index]
    if (btn.quickReply) {
      btn.quickReply = { ...btn.quickReply, [field]: value }
    } else if (btn.urlButton) {
      btn.urlButton = { ...btn.urlButton, [field]: value }
    } else if (btn.callButton) {
      btn.callButton = { ...btn.callButton, [field]: value }
    }
    setTemplateButtons(newButtons)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Enviar Mensagem</CardTitle>
        </div>
        <CardDescription>
          Envie mensagens de texto, mídia, localização, enquetes e mais.
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
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex w-max">
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
              <TabsTrigger value="sticker" className="gap-1">
                <Sticker className="h-4 w-4" />
                <span className="hidden sm:inline">Sticker</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="gap-1">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Local</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-1">
                <UserRound className="h-4 w-4" />
                <span className="hidden sm:inline">Contato</span>
              </TabsTrigger>
              <TabsTrigger value="poll" className="gap-1">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Enquete</span>
              </TabsTrigger>
              <TabsTrigger value="buttons" className="gap-1">
                <MousePointerClick className="h-4 w-4" />
                <span className="hidden sm:inline">Botões</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </TabsTrigger>
              <TabsTrigger value="template" className="gap-1">
                <LayoutTemplate className="h-4 w-4" />
                <span className="hidden sm:inline">Template</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

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

          {/* Image */}
          <TabsContent value="image" className="space-y-4">
            <div className="space-y-2">
              <Label>Imagem *</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {filename && <p className="text-sm text-muted-foreground">Selecionado: {filename}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Legenda (opcional)</Label>
              <Input
                id="caption"
                placeholder="Adicione uma legenda..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
          </TabsContent>

          {/* Document */}
          <TabsContent value="document" className="space-y-4">
            <div className="space-y-2">
              <Label>Documento *</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="*/*"
                onChange={handleFileChange}
              />
              {filename && <p className="text-sm text-muted-foreground">Selecionado: {filename}</p>}
            </div>
          </TabsContent>

          {/* Audio */}
          <TabsContent value="audio" className="space-y-4">
            <div className="space-y-2">
              <Label>Áudio *</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
              />
              {filename && <p className="text-sm text-muted-foreground">Selecionado: {filename}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="ptt"
                checked={ptt}
                onCheckedChange={setPtt}
              />
              <Label htmlFor="ptt">Enviar como mensagem de voz (PTT)</Label>
            </div>
          </TabsContent>

          {/* Video */}
          <TabsContent value="video" className="space-y-4">
            <div className="space-y-2">
              <Label>Vídeo *</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
              />
              {filename && <p className="text-sm text-muted-foreground">Selecionado: {filename}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Legenda (opcional)</Label>
              <Input
                id="caption"
                placeholder="Adicione uma legenda..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
          </TabsContent>

          {/* Sticker */}
          <TabsContent value="sticker" className="space-y-4">
            <div className="space-y-2">
              <Label>Figurinha * (WebP ou PNG)</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/webp,image/png"
                onChange={handleFileChange}
              />
              {filename && <p className="text-sm text-muted-foreground">Selecionado: {filename}</p>}
              <p className="text-xs text-muted-foreground">
                Recomendado: 512x512 pixels, formato WebP
              </p>
            </div>
          </TabsContent>

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

          {/* Poll */}
          <TabsContent value="poll" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pollName">Pergunta *</Label>
              <Input
                id="pollName"
                placeholder="Qual sua cor favorita?"
                value={pollName}
                onChange={(e) => setPollName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Opções * (mín. 2, máx. 12)</Label>
              {pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Opção ${index + 1}`}
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                  />
                  {pollOptions.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePollOption(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {pollOptions.length < 12 && (
                <Button type="button" variant="outline" size="sm" onClick={addPollOption}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Opção
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="selectableCount">Quantidade de escolhas permitidas</Label>
              <Input
                id="selectableCount"
                type="number"
                min={1}
                max={pollOptions.length}
                value={selectableCount}
                onChange={(e) => setSelectableCount(parseInt(e.target.value) || 1)}
              />
            </div>
          </TabsContent>

          {/* Buttons */}
          <TabsContent value="buttons" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headerText">Cabeçalho (opcional)</Label>
              <Input
                id="headerText"
                placeholder="Título"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentText">Conteúdo *</Label>
              <Textarea
                id="contentText"
                placeholder="Texto principal da mensagem..."
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerText">Rodapé (opcional)</Label>
              <Input
                id="footerText"
                placeholder="Texto do rodapé"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Botões * (máx. 3)</Label>
              {buttons.map((button, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Texto do botão ${index + 1}`}
                    value={button.displayText}
                    onChange={(e) => updateButton(index, e.target.value)}
                  />
                  {buttons.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeButton(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {buttons.length < 3 && (
                <Button type="button" variant="outline" size="sm" onClick={addButton}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Botão
                </Button>
              )}
            </div>
          </TabsContent>

          {/* List */}
          <TabsContent value="list" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="listTitle">Título *</Label>
                <Input
                  id="listTitle"
                  placeholder="Título do menu"
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="listButtonText">Texto do Botão *</Label>
                <Input
                  id="listButtonText"
                  placeholder="Abrir Menu"
                  value={listButtonText}
                  onChange={(e) => setListButtonText(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="listDescription">Descrição *</Label>
              <Textarea
                id="listDescription"
                placeholder="Selecione uma opção..."
                value={listDescription}
                onChange={(e) => setListDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerText">Rodapé (opcional)</Label>
              <Input
                id="footerText"
                placeholder="Texto do rodapé"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <Label>Seções *</Label>
              {sections.map((section, sIndex) => (
                <Card key={sIndex} className="p-4">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Título da seção"
                        value={section.title}
                        onChange={(e) => updateSectionTitle(sIndex, e.target.value)}
                      />
                      {sections.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSection(sIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="pl-4 space-y-2">
                      {section.rows.map((row, rIndex) => (
                        <div key={rIndex} className="flex gap-2">
                          <Input
                            placeholder="Título do item"
                            value={row.title}
                            onChange={(e) => updateRow(sIndex, rIndex, "title", e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Descrição (opcional)"
                            value={row.description || ""}
                            onChange={(e) => updateRow(sIndex, rIndex, "description", e.target.value)}
                            className="flex-1"
                          />
                          {section.rows.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRow(sIndex, rIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addRow(sIndex)}>
                        <Plus className="h-4 w-4 mr-1" /> Item
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSection}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar Seção
              </Button>
            </div>
          </TabsContent>

          {/* Template */}
          <TabsContent value="template" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateTitle">Título (opcional)</Label>
              <Input
                id="templateTitle"
                placeholder="Título do template"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateContent">Conteúdo *</Label>
              <Textarea
                id="templateContent"
                placeholder="Texto principal..."
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateFooter">Rodapé (opcional)</Label>
              <Input
                id="templateFooter"
                placeholder="Powered by..."
                value={templateFooter}
                onChange={(e) => setTemplateFooter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Botões * (máx. 3)</Label>
              {templateButtons.map((btn, index) => (
                <Card key={index} className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {btn.quickReply ? "Resposta Rápida" : btn.urlButton ? "Link" : "Ligar"}
                      </span>
                      {templateButtons.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTemplateButton(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Texto do botão"
                      value={btn.quickReply?.displayText || btn.urlButton?.displayText || btn.callButton?.displayText || ""}
                      onChange={(e) => updateTemplateButton(index, "displayText", e.target.value)}
                    />
                    {btn.urlButton && (
                      <Input
                        placeholder="URL (https://...)"
                        value={btn.urlButton.url}
                        onChange={(e) => updateTemplateButton(index, "url", e.target.value)}
                      />
                    )}
                    {btn.callButton && (
                      <Input
                        placeholder="Telefone (+5511...)"
                        value={btn.callButton.phoneNumber}
                        onChange={(e) => updateTemplateButton(index, "phoneNumber", e.target.value)}
                      />
                    )}
                  </div>
                </Card>
              ))}
              {templateButtons.length < 3 && (
                <div className="flex gap-2 flex-wrap">
                  <Button type="button" variant="outline" size="sm" onClick={() => addTemplateButton("quickReply")}>
                    <Plus className="h-4 w-4 mr-1" /> Resposta
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addTemplateButton("urlButton")}>
                    <Plus className="h-4 w-4 mr-1" /> Link
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addTemplateButton("callButton")}>
                    <Plus className="h-4 w-4 mr-1" /> Ligar
                  </Button>
                </div>
              )}
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
