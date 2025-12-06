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
  GalleryHorizontal,
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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { 
  MessageType,
  ButtonDTO,
  ListSectionDTO,
  ListRowDTO,
  TemplateButtonDTO,
  CarouselCardDTO,
  NativeFlowButtonDTO,
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
  sendInteractive,
  sendTemplate,
  sendCarousel,
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

  // Interactive (supports QuickReply - but can't mix with CTA buttons)
  const [interactiveTitle, setInteractiveTitle] = React.useState("")
  const [interactiveBody, setInteractiveBody] = React.useState("")
  const [interactiveFooter, setInteractiveFooter] = React.useState("")
  const [interactiveImage, setInteractiveImage] = React.useState("")
  const [interactiveImageMime, setInteractiveImageMime] = React.useState("")
  const [interactiveButtons, setInteractiveButtons] = React.useState<NativeFlowButtonDTO[]>([
    { name: "quick_reply", params: { display_text: "", id: "btn1" } }
  ])

  // Template (only URL and Call buttons - QuickReply NOT supported)
  const [templateTitle, setTemplateTitle] = React.useState("")
  const [templateContent, setTemplateContent] = React.useState("")
  const [templateFooter, setTemplateFooter] = React.useState("")
  const [templateImage, setTemplateImage] = React.useState("")
  const [templateImageMime, setTemplateImageMime] = React.useState("")
  const [templateButtons, setTemplateButtons] = React.useState<TemplateButtonDTO[]>([
    { index: 0, urlButton: { displayText: "", url: "" } }
  ])

  // Carousel
  const [carouselTitle, setCarouselTitle] = React.useState("")
  const [carouselBody, setCarouselBody] = React.useState("")
  const [carouselFooter, setCarouselFooter] = React.useState("")
  const [carouselCards, setCarouselCards] = React.useState<CarouselCardDTO[]>([
    { header: { title: "" }, body: "", footer: "", buttons: [{ name: "quick_reply", params: { display_text: "", id: "btn1" } }] }
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
    setInteractiveTitle("")
    setInteractiveBody("")
    setInteractiveFooter("")
    setInteractiveImage("")
    setInteractiveImageMime("")
    setInteractiveButtons([{ name: "quick_reply", params: { display_text: "", id: "btn1" } }])
    setTemplateTitle("")
    setTemplateContent("")
    setTemplateFooter("")
    setTemplateImage("")
    setTemplateImageMime("")
    setTemplateButtons([{ index: 0, urlButton: { displayText: "", url: "" } }])
    setCarouselTitle("")
    setCarouselBody("")
    setCarouselFooter("")
    setCarouselCards([{ header: { title: "" }, body: "", footer: "", buttons: [{ name: "quick_reply", params: { display_text: "", id: "btn1" } }] }])
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

        case "interactive":
          if (!interactiveBody.trim()) {
            toast.error("Informe o conteúdo da mensagem")
            setSending(false)
            return
          }
          const validInteractiveButtons = interactiveButtons.filter(
            b => (b.params as { display_text?: string }).display_text?.trim()
          )
          if (validInteractiveButtons.length === 0) {
            toast.error("Adicione pelo menos um botão")
            setSending(false)
            return
          }
          await sendInteractive(sessionId, {
            phone: cleanPhone,
            title: interactiveTitle.trim() || undefined,
            body: interactiveBody.trim(),
            footer: interactiveFooter.trim() || undefined,
            buttons: validInteractiveButtons,
            image: interactiveImage || undefined,
            mimetype: interactiveImageMime || undefined,
          })
          break

        case "template":
          if (!templateContent.trim()) {
            toast.error("Informe o conteúdo do template")
            setSending(false)
            return
          }
          const validTemplateButtons = templateButtons.filter(
            b => b.urlButton?.displayText?.trim() || b.callButton?.displayText?.trim()
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
            image: templateImage || undefined,
            mimetype: templateImageMime || undefined,
          })
          break

        case "carousel":
          const validCards = carouselCards.filter(c => c.body.trim())
          if (validCards.length === 0) {
            toast.error("Adicione pelo menos um card com conteúdo")
            setSending(false)
            return
          }
          await sendCarousel(sessionId, {
            phone: cleanPhone,
            title: carouselTitle.trim() || undefined,
            body: carouselBody.trim() || undefined,
            footer: carouselFooter.trim() || undefined,
            cards: validCards.map(card => ({
              header: {
                title: card.header.title?.trim() || undefined,
                image: card.header.image || undefined,
              },
              body: card.body.trim(),
              footer: card.footer?.trim() || undefined,
              buttons: card.buttons.filter(b => b.params.display_text),
            })),
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

  // Template button helpers (only URL and Call - QuickReply only works in Carousel)
  const addTemplateButton = (type: "urlButton" | "callButton") => {
    if (templateButtons.length < 3) {
      const index = templateButtons.length
      let newButton: TemplateButtonDTO = { index }
      if (type === "urlButton") {
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

  // Carousel helpers
  const addCarouselCard = () => {
    setCarouselCards([...carouselCards, { 
      header: { title: "" }, 
      body: "", 
      footer: "", 
      buttons: [{ name: "quick_reply", params: { display_text: "", id: `btn${Date.now()}` } }] 
    }])
  }

  const removeCarouselCard = (index: number) => {
    if (carouselCards.length > 1) {
      setCarouselCards(carouselCards.filter((_, i) => i !== index))
    }
  }

  const updateCarouselCard = (index: number, field: keyof CarouselCardDTO, value: string) => {
    const newCards = [...carouselCards]
    if (field === "body" || field === "footer") {
      newCards[index] = { ...newCards[index], [field]: value }
    }
    setCarouselCards(newCards)
  }

  const updateCarouselCardHeader = (index: number, field: string, value: string) => {
    const newCards = [...carouselCards]
    newCards[index] = { 
      ...newCards[index], 
      header: { ...newCards[index].header, [field]: value } 
    }
    setCarouselCards(newCards)
  }

  const addCarouselCardButton = (cardIndex: number) => {
    const newCards = [...carouselCards]
    if (newCards[cardIndex].buttons.length < 3) {
      newCards[cardIndex].buttons.push({ 
        name: "quick_reply", 
        params: { display_text: "", id: `btn${Date.now()}` } 
      })
      setCarouselCards(newCards)
    }
  }

  const removeCarouselCardButton = (cardIndex: number, buttonIndex: number) => {
    const newCards = [...carouselCards]
    if (newCards[cardIndex].buttons.length > 1) {
      newCards[cardIndex].buttons = newCards[cardIndex].buttons.filter((_, i) => i !== buttonIndex)
      setCarouselCards(newCards)
    }
  }

  const updateCarouselCardButton = (cardIndex: number, buttonIndex: number, value: string) => {
    const newCards = [...carouselCards]
    newCards[cardIndex].buttons[buttonIndex] = {
      ...newCards[cardIndex].buttons[buttonIndex],
      params: { ...newCards[cardIndex].buttons[buttonIndex].params, display_text: value }
    }
    setCarouselCards(newCards)
  }

  const handleCarouselCardImage = (cardIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máximo 5MB)")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]
      const newCards = [...carouselCards]
      newCards[cardIndex] = {
        ...newCards[cardIndex],
        header: { ...newCards[cardIndex].header, image: base64 }
      }
      setCarouselCards(newCards)
    }
    reader.onerror = () => {
      toast.error("Erro ao ler imagem")
    }
    reader.readAsDataURL(file)
  }

  const removeCarouselCardImage = (cardIndex: number) => {
    const newCards = [...carouselCards]
    newCards[cardIndex] = {
      ...newCards[cardIndex],
      header: { ...newCards[cardIndex].header, image: undefined }
    }
    setCarouselCards(newCards)
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Enviar Mensagem</CardTitle>
        </div>
        <CardDescription>
          Envie mensagens de texto, mídia, localização, enquetes e mais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 overflow-hidden">
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

        {/* Message Type Select */}
        <div className="space-y-2">
          <Label>Tipo de Mensagem</Label>
          <Select
            value={messageType}
            onValueChange={(v) => {
              setMessageType(v as MessageType)
              resetForm()
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Texto
                </div>
              </SelectItem>
              <SelectItem value="image">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" /> Imagem
                </div>
              </SelectItem>
              <SelectItem value="document">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Documento
                </div>
              </SelectItem>
              <SelectItem value="audio">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4" /> Áudio
                </div>
              </SelectItem>
              <SelectItem value="video">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" /> Vídeo
                </div>
              </SelectItem>
              <SelectItem value="sticker">
                <div className="flex items-center gap-2">
                  <Sticker className="h-4 w-4" /> Sticker
                </div>
              </SelectItem>
              <SelectItem value="location">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Localização
                </div>
              </SelectItem>
              <SelectItem value="contact">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" /> Contato
                </div>
              </SelectItem>
              <SelectItem value="poll">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Enquete
                </div>
              </SelectItem>
              <SelectItem value="buttons">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4" /> Botões
                </div>
              </SelectItem>
              <SelectItem value="list">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" /> Lista
                </div>
              </SelectItem>
              <SelectItem value="interactive">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4" /> Interativo (QuickReply)
                </div>
              </SelectItem>
              <SelectItem value="template">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4" /> Template (Link/Ligar)
                </div>
              </SelectItem>
              <SelectItem value="carousel">
                <div className="flex items-center gap-2">
                  <GalleryHorizontal className="h-4 w-4" /> Carrossel
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Text */}
        {messageType === "text" && (
          <div className="space-y-4">
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
          </div>)}

          {/* Image */}
          {messageType === "image" && (<div className="space-y-4">
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
          </div>)}

          {/* Document */}
          {messageType === "document" && (<div className="space-y-4">
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
          </div>)}

          {/* Audio */}
          {messageType === "audio" && (<div className="space-y-4">
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
          </div>)}

          {/* Video */}
          {messageType === "video" && (<div className="space-y-4">
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
          </div>)}

          {/* Sticker */}
          {messageType === "sticker" && (<div className="space-y-4">
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
          </div>)}

          {/* Location */}
          {messageType === "location" && (<div className="space-y-4">
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
          </div>)}

          {/* Contact */}
          {messageType === "contact" && (<div className="space-y-4">
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
          </div>)}

          {/* Poll */}
          {messageType === "poll" && (<div className="space-y-4">
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
                      size="icon-sm"
                      onClick={() => removePollOption(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {pollOptions.length < 12 && (
                <Button type="button" variant="outline" size="sm" onClick={addPollOption}>
                  <Plus className="h-4 w-4" /> Adicionar Opção
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
          </div>)}

          {/* Buttons */}
          {messageType === "buttons" && (<div className="space-y-4">
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
                      size="icon-sm"
                      onClick={() => removeButton(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {buttons.length < 3 && (
                <Button type="button" variant="outline" size="sm" onClick={addButton}>
                  <Plus className="h-4 w-4" /> Adicionar Botão
                </Button>
              )}
            </div>
          </div>)}

          {/* List */}
          {messageType === "list" && (<div className="space-y-4">
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
                          size="icon-sm"
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
                              size="icon-sm"
                              onClick={() => removeRow(sIndex, rIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addRow(sIndex)}>
                        <Plus className="h-4 w-4" /> Item
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSection}>
                <Plus className="h-4 w-4" /> Adicionar Seção
              </Button>
            </div>
          </div>)}

          {/* Interactive (QuickReply) */}
          {messageType === "interactive" && (<div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mensagem interativa com botões de Resposta Rápida. Não misture com botões de Link/Ligar.
            </p>
            <div className="space-y-2">
              <Label htmlFor="interactiveTitle">Título (opcional)</Label>
              <Input
                id="interactiveTitle"
                placeholder="Título da mensagem"
                value={interactiveTitle}
                onChange={(e) => setInteractiveTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interactiveBody">Conteúdo *</Label>
              <Textarea
                id="interactiveBody"
                placeholder="Texto principal..."
                value={interactiveBody}
                onChange={(e) => setInteractiveBody(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interactiveFooter">Rodapé (opcional)</Label>
              <Input
                id="interactiveFooter"
                placeholder="Texto do rodapé"
                value={interactiveFooter}
                onChange={(e) => setInteractiveFooter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Imagem (recomendado para WhatsApp Web)</Label>
              <p className="text-xs text-muted-foreground">QuickReply funciona melhor com imagem no WhatsApp Web</p>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Imagem muito grande (máx. 5MB)")
                    return
                  }
                  setInteractiveImageMime(file.type)
                  const reader = new FileReader()
                  reader.onload = () => {
                    setInteractiveImage((reader.result as string).split(",")[1])
                  }
                  reader.readAsDataURL(file)
                }}
              />
              {interactiveImage && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">Imagem selecionada</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setInteractiveImage(""); setInteractiveImageMime("") }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Botões de Resposta Rápida * (máx. 3)</Label>
              {interactiveButtons.map((btn, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Texto do botão ${index + 1}`}
                    value={(btn.params as { display_text?: string }).display_text || ""}
                    onChange={(e) => {
                      const newButtons = [...interactiveButtons]
                      newButtons[index] = {
                        ...newButtons[index],
                        params: { ...newButtons[index].params, display_text: e.target.value }
                      }
                      setInteractiveButtons(newButtons)
                    }}
                  />
                  {interactiveButtons.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setInteractiveButtons(interactiveButtons.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {interactiveButtons.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInteractiveButtons([...interactiveButtons, { name: "quick_reply", params: { display_text: "", id: `btn${Date.now()}` } }])}
                >
                  <Plus className="h-4 w-4" /> Adicionar Botão
                </Button>
              )}
            </div>
          </div>)}

          {/* Template */}
          {messageType === "template" && (<div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Template suporta apenas botões de Link e Ligar. Para Resposta Rápida, use o tipo Interativo.
            </p>
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
              <Label>Imagem (opcional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Imagem muito grande (máx. 5MB)")
                    return
                  }
                  setTemplateImageMime(file.type)
                  const reader = new FileReader()
                  reader.onload = () => {
                    setTemplateImage((reader.result as string).split(",")[1])
                  }
                  reader.readAsDataURL(file)
                }}
              />
              {templateImage && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">Imagem selecionada</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setTemplateImage(""); setTemplateImageMime("") }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Botões * (máx. 3) - Apenas Link e Ligar</Label>
              <p className="text-xs text-muted-foreground">Para Resposta Rápida, use o tipo Interativo</p>
              {templateButtons.map((btn, index) => (
                <Card key={index} className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {btn.urlButton ? "Link" : "Ligar"}
                      </span>
                      {templateButtons.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeTemplateButton(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Texto do botão"
                      value={btn.urlButton?.displayText || btn.callButton?.displayText || ""}
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
                  <Button type="button" variant="outline" size="sm" onClick={() => addTemplateButton("urlButton")}>
                    <Plus className="h-4 w-4" /> Link
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addTemplateButton("callButton")}>
                    <Plus className="h-4 w-4" /> Ligar
                  </Button>
                </div>
              )}
            </div>
          </div>)}

          {/* Carousel */}
          {messageType === "carousel" && (<div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="carouselTitle">Título (opcional)</Label>
              <Input
                id="carouselTitle"
                placeholder="Título do carrossel"
                value={carouselTitle}
                onChange={(e) => setCarouselTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carouselBody">Descrição (opcional)</Label>
              <Textarea
                id="carouselBody"
                placeholder="Texto de introdução..."
                value={carouselBody}
                onChange={(e) => setCarouselBody(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carouselFooter">Rodapé (opcional)</Label>
              <Input
                id="carouselFooter"
                placeholder="Texto do rodapé"
                value={carouselFooter}
                onChange={(e) => setCarouselFooter(e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <Label>Cards *</Label>
              {carouselCards.map((card, cardIndex) => (
                <Card key={cardIndex} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Card {cardIndex + 1}</span>
                      {carouselCards.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeCarouselCard(cardIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Título do card"
                        value={card.header.title || ""}
                        onChange={(e) => updateCarouselCardHeader(cardIndex, "title", e.target.value)}
                      />
                      <div className="space-y-1">
                        <Label className="text-xs">Imagem do card *</Label>
                        {card.header.image ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-green-600">Imagem selecionada</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCarouselCardImage(cardIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCarouselCardImage(cardIndex, e)}
                          />
                        )}
                      </div>
                      <Textarea
                        placeholder="Conteúdo do card *"
                        value={card.body}
                        onChange={(e) => updateCarouselCard(cardIndex, "body", e.target.value)}
                        rows={2}
                      />
                      <Input
                        placeholder="Rodapé do card (opcional)"
                        value={card.footer || ""}
                        onChange={(e) => updateCarouselCard(cardIndex, "footer", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Botões (máx. 3)</Label>
                      {card.buttons.map((btn, btnIndex) => (
                        <div key={btnIndex} className="flex gap-2">
                          <Input
                            placeholder={`Botão ${btnIndex + 1}`}
                            value={(btn.params as { display_text?: string }).display_text || ""}
                            onChange={(e) => updateCarouselCardButton(cardIndex, btnIndex, e.target.value)}
                          />
                          {card.buttons.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeCarouselCardButton(cardIndex, btnIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {card.buttons.length < 3 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => addCarouselCardButton(cardIndex)}>
                          <Plus className="h-4 w-4" /> Botão
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addCarouselCard}>
                <Plus className="h-4 w-4" /> Adicionar Card
              </Button>
            </div>
          </div>)}


        {/* Send Button */}
        <Button onClick={handleSend} disabled={sending} size="sm" className="w-full">
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Enviar Mensagem
        </Button>
      </CardContent>
    </Card>
  )
}
