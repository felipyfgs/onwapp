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

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="overflow-hidden min-w-0">
                <PageHeader
                    breadcrumbs={[{ label: "Chats" }]}
                    actions={
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedSession}
                                onValueChange={handleSessionChange}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Selecionar sessao" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map((s) => (
                                        <SelectItem
                                            key={s.session}
                                            value={s.session}
                                        >
                                            {s.pushName || s.session}
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
                            <div className="text-center">
                                <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-xl font-semibold mb-2">
                                    Selecione uma sessao
                                </h3>
                                <p className="text-muted-foreground">
                                    Escolha uma sessao WhatsApp conectada para
                                    iniciar
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
                                    selectedTicket={selectedTicket}
                                    onSelectTicket={handleSelectTicket}
                                    onTicketUpdate={handleTicketUpdate}
                                    refreshTrigger={ticketListKey}
                                    activeSubTab={activeSubTab}
                                    onSubTabChange={setActiveSubTab}
                                />
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={65}>
                                {selectedTicket ? (
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
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-muted/30">
                                        <div className="text-center">
                                            <TicketIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                            <h3 className="text-xl font-semibold mb-2">
                                                Selecione um ticket
                                            </h3>
                                            <p className="text-muted-foreground">
                                                Escolha um ticket na lista para
                                                ver a conversa
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
