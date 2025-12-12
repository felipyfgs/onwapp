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
import { TicketManager, ChatWindow } from "@/components/chat";
import { Settings, Ticket as TicketIcon } from "lucide-react";
import { useEffect, useCallback } from "react";
import { toast } from "sonner";

import { useChatSessions } from "@/hooks/useChatSessions";
import { useChatQueues } from "@/hooks/useChatQueues";
import { useChatCore } from "@/hooks/useChatCore";

export default function ChatsPage() {
    const { sessions, selectedSession, setSelectedSession } = useChatSessions();
    const { queues } = useChatQueues();
    const {
        selectedTicket,
        messages,
        loadingMessages,
        ticketListKey,
        activeSubTab,
        currentChat,
        handleSelectTicket,
        handleTicketUpdate,
        handleSendMessage,
        handleArchive,
        setActiveSubTab,
        resetChat,
    } = useChatCore(selectedSession);

    const handleSessionChange = (value: string) => {
        setSelectedSession(value);
        resetChat();
    };

    // Keyboard shortcuts for better UX
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Ignore if user is typing in an input
        if (event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement) {
            return;
        }

        // Ctrl/Cmd + K to focus session selector
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const sessionSelector = document.querySelector('[data-testid="session-selector"]') as HTMLButtonElement;
            sessionSelector?.click();
            return;
        }

        // Ctrl/Cmd + / to show keyboard shortcuts
        if ((event.ctrlKey || event.metaKey) && event.key === '/') {
            event.preventDefault();
            toast.info("Atalhos: Ctrl+K (Sessão), Ctrl+1 (Abertos), Ctrl+2 (Resolvidos), Ctrl+3 (Buscar), Esc (Limpar busca)");
            return;
        }

        // Ctrl/Cmd + 1/2/3 to switch tabs
        if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '3') {
            event.preventDefault();
            const tabNumber = parseInt(event.key);
            const tabButtons = document.querySelectorAll('[data-testid^="tab-"]');
            if (tabButtons[tabNumber - 1]) {
                (tabButtons[tabNumber - 1] as HTMLButtonElement).click();
            }
            return;
        }

        // Escape to clear search
        if (event.key === 'Escape') {
            const searchInput = document.querySelector('[data-testid="search-input"]') as HTMLInputElement;
            if (searchInput && searchInput.value) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
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
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
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
                        <div className="flex items-center justify-center h-full animate-fade-in">
                            <div className="text-center max-w-sm mx-auto p-6">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
                                    <Settings className="h-16 w-16 mx-auto relative text-muted-foreground" />
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
                                className="transition-all duration-300 ease-in-out"
                            >
                                <TicketManager
                                    session={selectedSession}
                                    selectedTicket={selectedTicket}
                                    onSelectTicket={handleSelectTicket}
                                    onTicketUpdate={handleTicketUpdate}
                                    refreshTrigger={ticketListKey}
                                    activeSubTab={activeSubTab}
                                    onSubTabChange={setActiveSubTab}
                                />
                            </ResizablePanel>
                            <ResizableHandle
                                withHandle
                                className="transition-colors hover:bg-primary/20"
                            />
                            <ResizablePanel
                                defaultSize={65}
                                className="transition-all duration-300 ease-in-out"
                            >
                                {selectedTicket ? (
                                    <div className="h-full animate-slide-in-right">
                                        <ChatWindow
                                            chat={currentChat}
                                            messages={messages}
                                            loading={loadingMessages}
                                            onSendMessage={handleSendMessage}
                                            onArchive={handleArchive}
                                            ticket={selectedTicket}
                                            session={selectedSession}
                                            queues={queues}
                                            onTicketAction={handleTicketUpdate}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-muted/30">
                                        <div className="text-center max-w-sm mx-auto p-6">
                                            <div className="relative mb-6">
                                                <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
                                                <TicketIcon className="h-16 w-16 mx-auto relative text-muted-foreground" />
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2 text-foreground">
                                                Selecione um ticket
                                            </h3>
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                Escolha um ticket na lista para ver a conversa
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
