"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/common";
import {
  sendTextMessage,
  sendImageMessage,
  sendAudioMessage,
  sendVideoMessage,
  sendDocumentMessage,
  sendStickerMessage,
  sendLocationMessage,
  sendContactMessage,
  sendPollMessage,
  sendReaction,
  sendButtonsMessage,
  sendListMessage,
  sendInteractiveMessage,
  sendTemplateMessage,
  sendCarouselMessage,
} from "@/lib/api";
import {
  Send,
  Image,
  FileText,
  MapPin,
  Mic,
  Video,
  CheckCircle,
  AlertCircle,
  User,
  Sticker,
  BarChart3,
  Heart,
  LayoutList,
  MousePointer,
  MessageSquare,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";

type MessageCategory = "basic" | "interactive" | "advanced";
type BasicType = "text" | "image" | "audio" | "video" | "document" | "sticker" | "location" | "contact";
type InteractiveType = "poll" | "reaction" | "buttons" | "list";
type AdvancedType = "interactive" | "template" | "carousel";

export default function MessagesPage() {
  const params = useParams();
  const sessionId = params.id as string;

  // Common state
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Category and type selection
  const [category, setCategory] = useState<MessageCategory>("basic");
  const [basicType, setBasicType] = useState<BasicType>("text");
  const [interactiveType, setInteractiveType] = useState<InteractiveType>("poll");
  const [advancedType, setAdvancedType] = useState<AdvancedType>("interactive");

  // Text message
  const [textMessage, setTextMessage] = useState("");

  // Media messages
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [filename, setFilename] = useState("");
  const [ptt, setPtt] = useState(false);

  // Location
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");

  // Contact
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Poll
  const [pollName, setPollName] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [selectableCount, setSelectableCount] = useState(1);

  // Reaction
  const [reactionMessageId, setReactionMessageId] = useState("");
  const [emoji, setEmoji] = useState("👍");

  // Buttons
  const [buttonsContent, setButtonsContent] = useState("");
  const [buttonsFooter, setButtonsFooter] = useState("");
  const [buttonsHeader, setButtonsHeader] = useState("");
  const [buttons, setButtons] = useState([{ buttonId: "btn1", displayText: "Opção 1" }]);

  // List
  const [listTitle, setListTitle] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [listButtonText, setListButtonText] = useState("Ver Opções");
  const [listSections, setListSections] = useState([{
    title: "Seção 1",
    rows: [{ title: "Item 1", description: "", rowId: "item1" }]
  }]);

  // Interactive
  const [interactiveTitle, setInteractiveTitle] = useState("");
  const [interactiveBody, setInteractiveBody] = useState("");
  const [interactiveFooter, setInteractiveFooter] = useState("");
  const [nativeButtons, setNativeButtons] = useState([{
    name: "quick_reply",
    params: { display_text: "Responder", id: "reply1" }
  }]);

  // Template
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [templateFooter, setTemplateFooter] = useState("");
  const [templateButtons, setTemplateButtons] = useState([{
    index: 0,
    quickReply: { displayText: "Opção 1", id: "opt1" }
  }]);

  // Carousel
  const [carouselTitle, setCarouselTitle] = useState("");
  const [carouselBody, setCarouselBody] = useState("");
  const [carouselFooter, setCarouselFooter] = useState("");
  const [carouselCards, setCarouselCards] = useState([{
    header: { title: "Card 1", image: "", video: "" },
    body: "Descrição do card 1",
    footer: "",
    buttons: [{ name: "quick_reply", params: { display_text: "Responder", id: "card1_btn1" } }]
  }]);

  const clearForm = () => {
    setTextMessage("");
    setMediaUrl("");
    setCaption("");
    setFilename("");
    setPtt(false);
    setLatitude("");
    setLongitude("");
    setLocationName("");
    setAddress("");
    setContactName("");
    setContactPhone("");
    setPollName("");
    setPollOptions(["", ""]);
    setReactionMessageId("");
    setEmoji("👍");
    setButtonsContent("");
    setButtonsFooter("");
    setButtonsHeader("");
    setButtons([{ buttonId: "btn1", displayText: "Opção 1" }]);
    setListTitle("");
    setListDescription("");
    setListButtonText("Ver Opções");
    setListSections([{ title: "Seção 1", rows: [{ title: "Item 1", description: "", rowId: "item1" }] }]);
    setInteractiveTitle("");
    setInteractiveBody("");
    setInteractiveFooter("");
    setNativeButtons([{ name: "quick_reply", params: { display_text: "Responder", id: "reply1" } }]);
    setTemplateTitle("");
    setTemplateContent("");
    setTemplateFooter("");
    setTemplateButtons([{ index: 0, quickReply: { displayText: "Opção 1", id: "opt1" } }]);
  };

  const handleSend = async () => {
    if (!sessionId || !recipient) {
      setResult({ success: false, message: "Preencha o destinatário" });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      if (category === "basic") {
        switch (basicType) {
          case "text":
            if (!textMessage) throw new Error("Digite uma mensagem");
            await sendTextMessage(sessionId, { phone: recipient, text: textMessage });
            break;
          case "image":
            if (!mediaUrl) throw new Error("Informe a URL ou base64 da imagem");
            await sendImageMessage(sessionId, { phone: recipient, image: mediaUrl, caption });
            break;
          case "audio":
            if (!mediaUrl) throw new Error("Informe a URL ou base64 do áudio");
            await sendAudioMessage(sessionId, { phone: recipient, audio: mediaUrl, ptt });
            break;
          case "video":
            if (!mediaUrl) throw new Error("Informe a URL ou base64 do vídeo");
            await sendVideoMessage(sessionId, { phone: recipient, video: mediaUrl, caption });
            break;
          case "document":
            if (!mediaUrl) throw new Error("Informe a URL ou base64 do documento");
            if (!filename) throw new Error("Informe o nome do arquivo");
            await sendDocumentMessage(sessionId, { phone: recipient, document: mediaUrl, filename });
            break;
          case "sticker":
            if (!mediaUrl) throw new Error("Informe a URL ou base64 do sticker");
            await sendStickerMessage(sessionId, { phone: recipient, sticker: mediaUrl });
            break;
          case "location":
            if (!latitude || !longitude) throw new Error("Informe latitude e longitude");
            await sendLocationMessage(sessionId, {
              phone: recipient,
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              name: locationName,
              address,
            });
            break;
          case "contact":
            if (!contactName || !contactPhone) throw new Error("Informe nome e telefone do contato");
            await sendContactMessage(sessionId, {
              phone: recipient,
              contactName,
              contactPhone,
            });
            break;
        }
      } else if (category === "interactive") {
        switch (interactiveType) {
          case "poll":
            if (!pollName) throw new Error("Informe a pergunta da enquete");
            const validOptions = pollOptions.filter(o => o.trim());
            if (validOptions.length < 2) throw new Error("Adicione pelo menos 2 opções");
            await sendPollMessage(sessionId, {
              phone: recipient,
              name: pollName,
              options: validOptions,
              selectableCount,
            });
            break;
          case "reaction":
            if (!reactionMessageId) throw new Error("Informe o ID da mensagem");
            if (!emoji) throw new Error("Selecione um emoji");
            await sendReaction(sessionId, {
              phone: recipient,
              messageId: reactionMessageId,
              emoji,
            });
            break;
          case "buttons":
            if (!buttonsContent) throw new Error("Informe o conteúdo da mensagem");
            if (buttons.length === 0) throw new Error("Adicione pelo menos um botão");
            await sendButtonsMessage(sessionId, {
              phone: recipient,
              contentText: buttonsContent,
              footerText: buttonsFooter || undefined,
              headerText: buttonsHeader || undefined,
              buttons: buttons.map(b => ({ buttonId: b.buttonId, displayText: b.displayText })),
            });
            break;
          case "list":
            if (!listTitle || !listDescription) throw new Error("Informe título e descrição");
            if (!listButtonText) throw new Error("Informe o texto do botão");
            await sendListMessage(sessionId, {
              phone: recipient,
              title: listTitle,
              description: listDescription,
              buttonText: listButtonText,
              footerText: undefined,
              sections: listSections.map(s => ({
                title: s.title,
                rows: s.rows.map(r => ({ title: r.title, description: r.description, rowId: r.rowId })),
              })),
            });
            break;
        }
      } else if (category === "advanced") {
        switch (advancedType) {
          case "interactive":
            if (!interactiveBody) throw new Error("Informe o corpo da mensagem");
            await sendInteractiveMessage(sessionId, {
              phone: recipient,
              title: interactiveTitle || undefined,
              body: interactiveBody,
              footer: interactiveFooter || undefined,
              buttons: nativeButtons.map(b => ({ name: b.name, params: b.params })),
            });
            break;
          case "template":
            if (!templateContent) throw new Error("Informe o conteúdo do template");
            await sendTemplateMessage(sessionId, {
              phone: recipient,
              title: templateTitle || undefined,
              content: templateContent,
              footer: templateFooter || undefined,
              buttons: templateButtons,
            });
            break;
          case "carousel":
            if (carouselCards.length === 0) throw new Error("Adicione pelo menos um card");
            if (carouselCards.some(c => !c.body)) throw new Error("Todos os cards precisam ter corpo");
            await sendCarouselMessage(sessionId, {
              phone: recipient,
              title: carouselTitle || undefined,
              body: carouselBody || undefined,
              footer: carouselFooter || undefined,
              cards: carouselCards.map(c => ({
                header: {
                  title: c.header.title || undefined,
                  image: c.header.image || undefined,
                  video: c.header.video || undefined,
                },
                body: c.body,
                footer: c.footer || undefined,
                buttons: c.buttons,
              })),
            });
            break;
        }
      }

      setResult({ success: true, message: "Mensagem enviada com sucesso!" });
      clearForm();
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : "Falha ao enviar" });
    } finally {
      setSending(false);
    }
  };

  const basicTypes = [
    { value: "text", label: "Texto", icon: MessageSquare },
    { value: "image", label: "Imagem", icon: Image },
    { value: "audio", label: "Áudio", icon: Mic },
    { value: "video", label: "Vídeo", icon: Video },
    { value: "document", label: "Documento", icon: FileText },
    { value: "sticker", label: "Sticker", icon: Sticker },
    { value: "location", label: "Local", icon: MapPin },
    { value: "contact", label: "Contato", icon: User },
  ];

  const interactiveTypes = [
    { value: "poll", label: "Enquete", icon: BarChart3 },
    { value: "reaction", label: "Reação", icon: Heart },
    { value: "buttons", label: "Botões", icon: MousePointer },
    { value: "list", label: "Lista", icon: LayoutList },
  ];

  const advancedTypes = [
    { value: "interactive", label: "Interactive", icon: MousePointer },
    { value: "template", label: "Template", icon: FileText },
    { value: "carousel", label: "Carrossel", icon: Layers },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader
          breadcrumbs={[
            { label: "Sessions", href: "/sessions" },
            { label: sessionId, href: `/sessions/${sessionId}` },
            { label: "Messages" },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="max-w-3xl mx-auto w-full">
            <Card>
              <CardHeader>
                <CardTitle>Enviar Mensagem</CardTitle>
                <CardDescription>
                  Envie mensagens WhatsApp com suporte a todos os tipos de conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recipient */}
                <div className="space-y-2">
                  <Label>Destinatário (Telefone ou JID)</Label>
                  <Input
                    placeholder="5511999999999"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </div>

                {/* Category Tabs */}
                <Tabs value={category} onValueChange={(v) => setCategory(v as MessageCategory)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="interactive">Interativo</TabsTrigger>
                    <TabsTrigger value="advanced">Avançado</TabsTrigger>
                  </TabsList>

                  {/* Basic Messages */}
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                      {basicTypes.map((type) => (
                        <Button
                          key={type.value}
                          variant={basicType === type.value ? "default" : "outline"}
                          size="sm"
                          className="flex flex-col h-16 gap-1 p-1"
                          onClick={() => setBasicType(type.value as BasicType)}
                        >
                          <type.icon className="h-4 w-4" />
                          <span className="text-[10px]">{type.label}</span>
                        </Button>
                      ))}
                    </div>

                    {basicType === "text" && (
                      <div className="space-y-2">
                        <Label>Mensagem</Label>
                        <Textarea
                          placeholder="Digite sua mensagem..."
                          value={textMessage}
                          onChange={(e) => setTextMessage(e.target.value)}
                          rows={4}
                        />
                      </div>
                    )}

                    {(basicType === "image" || basicType === "video" || basicType === "audio" || basicType === "document" || basicType === "sticker") && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>URL ou Base64 da Mídia</Label>
                          <Input
                            placeholder="https://exemplo.com/arquivo.jpg"
                            value={mediaUrl}
                            onChange={(e) => setMediaUrl(e.target.value)}
                          />
                        </div>
                        {(basicType === "image" || basicType === "video") && (
                          <div className="space-y-2">
                            <Label>Legenda (opcional)</Label>
                            <Input
                              placeholder="Legenda..."
                              value={caption}
                              onChange={(e) => setCaption(e.target.value)}
                            />
                          </div>
                        )}
                        {basicType === "document" && (
                          <div className="space-y-2">
                            <Label>Nome do Arquivo</Label>
                            <Input
                              placeholder="documento.pdf"
                              value={filename}
                              onChange={(e) => setFilename(e.target.value)}
                            />
                          </div>
                        )}
                        {basicType === "audio" && (
                          <div className="flex items-center space-x-2">
                            <Switch checked={ptt} onCheckedChange={setPtt} />
                            <Label>Push-to-talk (áudio de voz)</Label>
                          </div>
                        )}
                      </div>
                    )}

                    {basicType === "location" && (
                      <div className="space-y-4">
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
                        <div className="space-y-2">
                          <Label>Nome do Local (opcional)</Label>
                          <Input
                            placeholder="São Paulo"
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Endereço (opcional)</Label>
                          <Input
                            placeholder="Av. Paulista, 1000"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {basicType === "contact" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nome do Contato</Label>
                          <Input
                            placeholder="João Silva"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefone do Contato</Label>
                          <Input
                            placeholder="5511999999999"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Interactive Messages */}
                  <TabsContent value="interactive" className="space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                      {interactiveTypes.map((type) => (
                        <Button
                          key={type.value}
                          variant={interactiveType === type.value ? "default" : "outline"}
                          size="sm"
                          className="flex flex-col h-16 gap-1"
                          onClick={() => setInteractiveType(type.value as InteractiveType)}
                        >
                          <type.icon className="h-4 w-4" />
                          <span className="text-xs">{type.label}</span>
                        </Button>
                      ))}
                    </div>

                    {interactiveType === "poll" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Pergunta da Enquete</Label>
                          <Input
                            placeholder="Qual sua cor favorita?"
                            value={pollName}
                            onChange={(e) => setPollName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Opções</Label>
                          {pollOptions.map((opt, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input
                                placeholder={`Opção ${idx + 1}`}
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...pollOptions];
                                  newOpts[idx] = e.target.value;
                                  setPollOptions(newOpts);
                                }}
                              />
                              {idx > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPollOptions([...pollOptions, ""])}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Adicionar Opção
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Máximo de Seleções</Label>
                          <Input
                            type="number"
                            min={1}
                            max={pollOptions.length}
                            value={selectableCount}
                            onChange={(e) => setSelectableCount(parseInt(e.target.value) || 1)}
                          />
                        </div>
                      </div>
                    )}

                    {interactiveType === "reaction" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>ID da Mensagem</Label>
                          <Input
                            placeholder="3EB0ABC123..."
                            value={reactionMessageId}
                            onChange={(e) => setReactionMessageId(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Emoji</Label>
                          <div className="flex gap-2 flex-wrap">
                            {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((e) => (
                              <Button
                                key={e}
                                variant={emoji === e ? "default" : "outline"}
                                size="sm"
                                onClick={() => setEmoji(e)}
                              >
                                {e}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {interactiveType === "buttons" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Cabeçalho (opcional)</Label>
                          <Input
                            placeholder="Título"
                            value={buttonsHeader}
                            onChange={(e) => setButtonsHeader(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Conteúdo</Label>
                          <Textarea
                            placeholder="Escolha uma opção..."
                            value={buttonsContent}
                            onChange={(e) => setButtonsContent(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rodapé (opcional)</Label>
                          <Input
                            placeholder="Texto do rodapé"
                            value={buttonsFooter}
                            onChange={(e) => setButtonsFooter(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Botões (máx. 3)</Label>
                          {buttons.map((btn, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input
                                placeholder="ID"
                                value={btn.buttonId}
                                className="w-24"
                                onChange={(e) => {
                                  const newBtns = [...buttons];
                                  newBtns[idx].buttonId = e.target.value;
                                  setButtons(newBtns);
                                }}
                              />
                              <Input
                                placeholder="Texto do botão"
                                value={btn.displayText}
                                onChange={(e) => {
                                  const newBtns = [...buttons];
                                  newBtns[idx].displayText = e.target.value;
                                  setButtons(newBtns);
                                }}
                              />
                              {idx > 0 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setButtons(buttons.filter((_, i) => i !== idx))}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {buttons.length < 3 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setButtons([...buttons, { buttonId: `btn${buttons.length + 1}`, displayText: "" }])}
                            >
                              <Plus className="h-4 w-4 mr-2" /> Adicionar Botão
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {interactiveType === "list" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Título</Label>
                          <Input
                            placeholder="Menu"
                            value={listTitle}
                            onChange={(e) => setListTitle(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Textarea
                            placeholder="Escolha uma opção abaixo"
                            value={listDescription}
                            onChange={(e) => setListDescription(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Texto do Botão</Label>
                          <Input
                            placeholder="Ver Opções"
                            value={listButtonText}
                            onChange={(e) => setListButtonText(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Seções</Label>
                          {listSections.map((section, sIdx) => (
                            <Card key={sIdx} className="p-3">
                              <Input
                                placeholder="Título da Seção"
                                value={section.title}
                                className="mb-2"
                                onChange={(e) => {
                                  const newSections = [...listSections];
                                  newSections[sIdx].title = e.target.value;
                                  setListSections(newSections);
                                }}
                              />
                              {section.rows.map((row, rIdx) => (
                                <div key={rIdx} className="flex gap-2 mb-1">
                                  <Input
                                    placeholder="Título"
                                    value={row.title}
                                    className="flex-1"
                                    onChange={(e) => {
                                      const newSections = [...listSections];
                                      newSections[sIdx].rows[rIdx].title = e.target.value;
                                      setListSections(newSections);
                                    }}
                                  />
                                  <Input
                                    placeholder="Descrição"
                                    value={row.description}
                                    className="flex-1"
                                    onChange={(e) => {
                                      const newSections = [...listSections];
                                      newSections[sIdx].rows[rIdx].description = e.target.value;
                                      setListSections(newSections);
                                    }}
                                  />
                                </div>
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newSections = [...listSections];
                                  newSections[sIdx].rows.push({ title: "", description: "", rowId: `item${Date.now()}` });
                                  setListSections(newSections);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Item
                              </Button>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Advanced Messages */}
                  <TabsContent value="advanced" className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {advancedTypes.map((type) => (
                        <Button
                          key={type.value}
                          variant={advancedType === type.value ? "default" : "outline"}
                          size="sm"
                          className="flex flex-col h-16 gap-1"
                          onClick={() => setAdvancedType(type.value as AdvancedType)}
                        >
                          <type.icon className="h-4 w-4" />
                          <span className="text-xs">{type.label}</span>
                        </Button>
                      ))}
                    </div>

                    {advancedType === "interactive" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Título (opcional)</Label>
                          <Input
                            placeholder="Título"
                            value={interactiveTitle}
                            onChange={(e) => setInteractiveTitle(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Corpo da Mensagem</Label>
                          <Textarea
                            placeholder="Conteúdo principal..."
                            value={interactiveBody}
                            onChange={(e) => setInteractiveBody(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rodapé (opcional)</Label>
                          <Input
                            placeholder="Rodapé"
                            value={interactiveFooter}
                            onChange={(e) => setInteractiveFooter(e.target.value)}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tipos de botões: quick_reply, cta_url, cta_call, cta_copy
                        </p>
                      </div>
                    )}

                    {advancedType === "template" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Título (opcional)</Label>
                          <Input
                            placeholder="Bem-vindo!"
                            value={templateTitle}
                            onChange={(e) => setTemplateTitle(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Conteúdo</Label>
                          <Textarea
                            placeholder="Escolha uma das opções abaixo..."
                            value={templateContent}
                            onChange={(e) => setTemplateContent(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rodapé (opcional)</Label>
                          <Input
                            placeholder="Powered by OnWapp"
                            value={templateFooter}
                            onChange={(e) => setTemplateFooter(e.target.value)}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tipos de botões: QuickReply, URLButton, CallButton
                        </p>
                      </div>
                    )}

                    {advancedType === "carousel" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Título do Carousel (opcional)</Label>
                          <Input
                            placeholder="Confira nossos produtos"
                            value={carouselTitle}
                            onChange={(e) => setCarouselTitle(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Corpo Principal (opcional)</Label>
                          <Textarea
                            placeholder="Navegue pelos nossos destaques"
                            value={carouselBody}
                            onChange={(e) => setCarouselBody(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rodapé (opcional)</Label>
                          <Input
                            placeholder="Powered by OnWapp"
                            value={carouselFooter}
                            onChange={(e) => setCarouselFooter(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Cards ({carouselCards.length})</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCarouselCards([...carouselCards, {
                                header: { title: `Card ${carouselCards.length + 1}`, image: "", video: "" },
                                body: "",
                                footer: "",
                                buttons: [{ name: "quick_reply", params: { display_text: "Responder", id: `card${carouselCards.length + 1}_btn1` } }]
                              }])}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Adicionar Card
                            </Button>
                          </div>

                          {carouselCards.map((card, cIdx) => (
                            <Card key={cIdx} className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">Card {cIdx + 1}</span>
                                {carouselCards.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCarouselCards(carouselCards.filter((_, i) => i !== cIdx))}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Título do Header</Label>
                                <Input
                                  placeholder="Produto A"
                                  value={card.header.title}
                                  onChange={(e) => {
                                    const newCards = [...carouselCards];
                                    newCards[cIdx].header.title = e.target.value;
                                    setCarouselCards(newCards);
                                  }}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">URL da Imagem (opcional)</Label>
                                <Input
                                  placeholder="https://exemplo.com/produto.jpg"
                                  value={card.header.image}
                                  onChange={(e) => {
                                    const newCards = [...carouselCards];
                                    newCards[cIdx].header.image = e.target.value;
                                    setCarouselCards(newCards);
                                  }}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">URL do Vídeo (opcional)</Label>
                                <Input
                                  placeholder="https://exemplo.com/video.mp4"
                                  value={card.header.video}
                                  onChange={(e) => {
                                    const newCards = [...carouselCards];
                                    newCards[cIdx].header.video = e.target.value;
                                    setCarouselCards(newCards);
                                  }}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Corpo do Card *</Label>
                                <Textarea
                                  placeholder="Descrição do produto..."
                                  value={card.body}
                                  rows={2}
                                  onChange={(e) => {
                                    const newCards = [...carouselCards];
                                    newCards[cIdx].body = e.target.value;
                                    setCarouselCards(newCards);
                                  }}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Rodapé do Card (opcional)</Label>
                                <Input
                                  placeholder="R$ 99,90"
                                  value={card.footer}
                                  onChange={(e) => {
                                    const newCards = [...carouselCards];
                                    newCards[cIdx].footer = e.target.value;
                                    setCarouselCards(newCards);
                                  }}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Botões do Card</Label>
                                {card.buttons.map((btn, bIdx) => (
                                  <div key={bIdx} className="flex gap-2">
                                    <select
                                      className="w-32 rounded-md border border-input bg-background px-2 py-1 text-sm"
                                      value={btn.name}
                                      onChange={(e) => {
                                        const newCards = [...carouselCards];
                                        newCards[cIdx].buttons[bIdx].name = e.target.value;
                                        setCarouselCards(newCards);
                                      }}
                                    >
                                      <option value="quick_reply">Quick Reply</option>
                                      <option value="cta_url">CTA URL</option>
                                      <option value="cta_call">CTA Call</option>
                                      <option value="cta_copy">CTA Copy</option>
                                    </select>
                                    <Input
                                      placeholder="Texto do botão"
                                      className="flex-1"
                                      value={(btn.params as Record<string, string>).display_text || ""}
                                      onChange={(e) => {
                                        const newCards = [...carouselCards];
                                        (newCards[cIdx].buttons[bIdx].params as Record<string, string>).display_text = e.target.value;
                                        setCarouselCards(newCards);
                                      }}
                                    />
                                    {card.buttons.length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          const newCards = [...carouselCards];
                                          newCards[cIdx].buttons = newCards[cIdx].buttons.filter((_, i) => i !== bIdx);
                                          setCarouselCards(newCards);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newCards = [...carouselCards];
                                    newCards[cIdx].buttons.push({
                                      name: "quick_reply",
                                      params: { display_text: "", id: `card${cIdx + 1}_btn${card.buttons.length + 1}` }
                                    });
                                    setCarouselCards(newCards);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" /> Botão
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Result */}
                {result && (
                  <div className={`flex items-center gap-2 p-4 rounded-lg ${result.success ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                    {result.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span>{result.message}</span>
                  </div>
                )}

                {/* Send Button */}
                <Button onClick={handleSend} disabled={sending} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? "Enviando..." : "Enviar Mensagem"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
