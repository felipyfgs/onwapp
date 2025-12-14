"use client";

import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { PageHeader } from "@/components/common";
import { ChatList, ChatWindow } from "@/components/chat";
import { Settings, MessageCircle } from "lucide-react";
import { useEffect, useCallback } from "react";
import { toast } from "sonner";

import { useChatSessions } from "@/hooks/useChatSessions";
import { useChatCore } from "@/hooks/useChatCore";

export default function ChatsPage() {
    const { sessions, selectedSession, setSelectedSession } = useChatSessions();
    const {
        selectedChat,
        messages,
        loadingMessages,
        chatListKey,
        currentChat,
        handleSelectChat,
        handleSendMessage,
        handleArchive,
        resetChat,
    } = useChatCore(selectedSession);

    const handleSessionChange = (value: string) => {
        setSelectedSession(value);
        resetChat();
    };

    // Basic keyboard shortcuts
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement) {
            return;
        }

        // Ctrl/Cmd + K to focus session selector
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const sessionSelector = document.querySelector('[data-testid="session-selector"]') as HTMLButtonElement;
            sessionSelector?.click();
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="overflow-hidden min-w-0">
                <PageHeader
                    breadcrumbs={[{ label: "Chats" }]}
                    actions={
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="hidden sm:inline">Online</span>
                            </div>
                            <Select
                                value={selectedSession}
                                onValueChange={handleSessionChange}
                            >
                                <SelectTrigger
                                    className="w-[180px] sm:w-[220px] border-primary/20 focus:border-primary focus-ring"
                                    data-testid="session-selector"
                                >
                                    <SelectValue placeholder="Selecionar sessão" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map((s) => (
                                        <SelectItem
                                            key={s.session}
                                            value={s.session}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                                <span>{s.pushName || s.session}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    }
                />

                <div className="h-[calc(100vh-4rem)] overflow-hidden">
                    {!selectedSession ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center max-w-sm mx-auto p-6">
                                <div className="mb-6">
                                    <Settings className="h-16 w-16 mx-auto text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-foreground">
                                    Selecione uma sessão
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Escolha uma sessão WhatsApp conectada para iniciar
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ResizablePanelGroup
                            direction="horizontal"
                            className="h-full"
                        >
                            <ResizablePanel
                                defaultSize={35}
                                minSize={25}
                                maxSize={45}
                            >
                                <TicketManager
                                    session={selectedSession}
                                    selectedChat={selectedChat}
                                    onSelectChat={handleSelectChat}
                                    refreshTrigger={chatListKey}
                                />
                            </ResizablePanel>
                            <ResizableHandle
                                withHandle
                            />
                            <ResizablePanel
                                defaultSize={65}
                            >
                                {selectedChat ? (
                                    <div className="h-full">
                                        <ChatWindow
                                            chat={currentChat}
                                            messages={messages}
                                            loading={loadingMessages}
                                            onSendMessage={handleSendMessage}
                                            onArchive={handleArchive}
                                            session={selectedSession}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-muted/30">
                                        <div className="text-center max-w-sm mx-auto p-6">
                                            <div className="mb-6">
                                                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground" />
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2 text-foreground">
                                                Selecione um chat
                                            </h3>
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                Escolha um chat na lista para ver a conversa
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
