"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { MESSAGE_TYPES, MESSAGE_STATUS } from "@/lib/constants";

interface Chat {
  id: string;
  jid: string;
  name: string;
  contactName: string;
  unreadCount: number;
  markedAsUnread: boolean;
  ephemeralExpiration: number;
  conversationTS: number;
  readOnly: boolean;
  suspended: boolean;
  locked: boolean;
  isGroup: boolean;
  archived: boolean;
  pinned: boolean;
  muted: boolean;
  lastMessage?: {
    content: string;
    timestamp: number;
    fromMe: boolean;
    type: string;
    mediaType: string;
    status: string;
    senderJID: string;
    pushName: string;
  };
}

interface Message {
  msgId: string;
  chatJID: string;
  senderJID: string;
  pushName: string;
  timestamp: number;
  type: string;
  mediaType: string;
  content: string;
  fromMe: boolean;
  isGroup: boolean;
  quotedID?: string;
  quotedSender?: string;
  status: string;
  deleted: boolean;
}

export default function MessagesPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { toast } = useToast();

  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("chats");
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [messageType, setMessageType] = useState(MESSAGE_TYPES.TEXT);

  useEffect(() => {
    if (sessionId) {
      fetchChats();
    }
  }, [sessionId]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await api.getAllChats(sessionId);
      setChats(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch chats");
      toast({
        variant: "destructive",
        title: "Erro ao buscar chats",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao buscar os chats.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatJID: string) => {
    try {
      const response = await api.getChatMessages(sessionId, chatJID);
      setMessages(response.data || []);
      setActiveTab("messages");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao buscar mensagens",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao buscar as mensagens.",
      });
    }
  };

  const sendMessage = async () => {
    if (!messageContent) {
      toast({
        variant: "destructive",
        title: "Mensagem vazia",
        description: "Por favor, digite uma mensagem para enviar.",
      });
      return;
    }

    if (!selectedChat) {
      toast({
        variant: "destructive",
        title: "Chat não selecionado",
        description: "Por favor, selecione um chat para enviar a mensagem.",
      });
      return;
    }

    try {
      let response;
      switch (messageType) {
        case MESSAGE_TYPES.TEXT:
          response = await api.sendText(sessionId, selectedChat.jid, messageContent);
          break;
        case MESSAGE_TYPES.IMAGE:
          response = await api.sendImage(sessionId, selectedChat.jid, messageContent);
          break;
        case MESSAGE_TYPES.AUDIO:
          response = await api.sendAudio(sessionId, selectedChat.jid, messageContent);
          break;
        case MESSAGE_TYPES.VIDEO:
          response = await api.sendVideo(sessionId, selectedChat.jid, messageContent);
          break;
        case MESSAGE_TYPES.DOCUMENT:
          response = await api.sendDocument(sessionId, selectedChat.jid, messageContent);
          break;
        default:
          response = await api.sendText(sessionId, selectedChat.jid, messageContent);
      }

      toast({
        title: "Mensagem enviada",
        description: "A mensagem foi enviada com sucesso.",
      });

      setShowSendDialog(false);
      setMessageContent("");
      fetchMessages(selectedChat.jid);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao enviar a mensagem.",
      });
    }
  };

  const getMessageStatusBadge = (status: string) => {
    switch (status) {
      case MESSAGE_STATUS.SENT:
        return <Badge variant="secondary">Enviada</Badge>;
      case MESSAGE_STATUS.DELIVERED:
        return <Badge variant="info">Entregue</Badge>;
      case MESSAGE_STATUS.READ:
        return <Badge variant="success">Lida</Badge>;
      case MESSAGE_STATUS.FAILED:
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case MESSAGE_TYPES.IMAGE:
        return "📷";
      case MESSAGE_TYPES.AUDIO:
        return "🎵";
      case MESSAGE_TYPES.VIDEO:
        return "🎬";
      case MESSAGE_TYPES.DOCUMENT:
        return "📄";
      case MESSAGE_TYPES.STICKER:
        return "😊";
      case MESSAGE_TYPES.LOCATION:
        return "📍";
      case MESSAGE_TYPES.CONTACT:
        return "👤";
      case MESSAGE_TYPES.POLL:
        return "📊";
      case MESSAGE_TYPES.BUTTONS:
      case MESSAGE_TYPES.LIST:
      case MESSAGE_TYPES.INTERACTIVE:
      case MESSAGE_TYPES.TEMPLATE:
      case MESSAGE_TYPES.CAROUSEL:
        return "🔹";
      default:
        return "";
    }
  };

  if (loading && chats.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mensagens do WhatsApp</h1>
        {selectedChat && (
          <Button onClick={() => setShowSendDialog(true)}>Enviar Mensagem</Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="messages" disabled={!selectedChat}>
            Mensagens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats">
          {chats.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Nenhum chat encontrado</h2>
              <p className="text-gray-500 mb-4">
                Você não tem nenhum chat no momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chats.map((chat) => (
                <Card
                  key={chat.jid}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedChat(chat);
                    fetchMessages(chat.jid);
                  }}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{chat.name || chat.contactName}</CardTitle>
                      {chat.unreadCount > 0 && (
                        <Badge variant="destructive" className="rounded-full h-6 w-6 flex items-center justify-center">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {chat.lastMessage && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage.fromMe ? "Você: " : ""}
                          {chat.lastMessage.content}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">
                            {new Date(chat.lastMessage.timestamp * 1000).toLocaleTimeString()}
                          </span>
                          {chat.lastMessage.status && getMessageStatusBadge(chat.lastMessage.status)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages">
          {selectedChat && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedChat.name || selectedChat.contactName}</CardTitle>
                      <p className="text-sm text-gray-500">{selectedChat.jid}</p>
                    </div>
                    <div className="flex gap-2">
                      {selectedChat.isGroup && (
                        <Badge variant="secondary">Grupo</Badge>
                      )}
                      {selectedChat.pinned && (
                        <Badge variant="outline">Fixado</Badge>
                      )}
                      {selectedChat.muted && (
                        <Badge variant="outline">Silenciado</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Última conversa</p>
                      <p className="font-medium">
                        {selectedChat.conversationTS > 0
                          ? new Date(selectedChat.conversationTS * 1000).toLocaleString()
                          : "Nunca"}
                      </p>
                    </div>
                    {selectedChat.ephemeralExpiration > 0 && (
                      <div>
                        <p className="text-sm text-gray-500">Expiração de mensagens</p>
                        <p className="font-medium">
                          {selectedChat.ephemeralExpiration / 86400} dias
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowSendDialog(true)}
                    >
                      Enviar Mensagem
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mensagens</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-400px)]">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <h3 className="text-lg font-medium">Nenhuma mensagem encontrada</h3>
                        <p className="text-sm text-gray-500">
                          Este chat não tem mensagens no momento.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.msgId}
                            className={`flex ${message.fromMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                message.fromMe
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.pushName}`}
                                  />
                                  <AvatarFallback>
                                    {message.pushName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">
                                  {message.fromMe ? "Você" : message.pushName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.timestamp * 1000).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                {getMessageTypeIcon(message.type)}
                                <p className="text-sm">
                                  {message.deleted ? "Mensagem excluída" : message.content}
                                </p>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                {message.status && getMessageStatusBadge(message.status)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Mensagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="messageType">Tipo de Mensagem</Label>
              <select
                id="messageType"
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {Object.entries(MESSAGE_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="messageContent">Conteúdo da Mensagem</Label>
              {messageType === MESSAGE_TYPES.TEXT ? (
                <Textarea
                  id="messageContent"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Digite sua mensagem aqui"
                  rows={5}
                />
              ) : (
                <Input
                  id="messageContent"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setMessageContent(event.target.result as string);
                        }
                      };
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSendDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={sendMessage}>Enviar Mensagem</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}