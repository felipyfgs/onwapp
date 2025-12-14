"use client";

import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { PageHeader } from "@/components/common";
import { ChatList, ChatWindow } from "@/components/chat";
import { MessageCircle } from "lucide-react";
import { useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

import { useChatCore } from "@/hooks/useChatCore";

export default function ChatsPage() {
    const params = useParams();
    const sessionId = params.id as string;

    const {
        selectedChat,
        messages,
        loadingMessages,
        chatListKey,
        currentChat,
        handleSelectChat,
        handleSendMessage,
        handleArchive,
    } = useChatCore(sessionId);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="overflow-hidden min-w-0">
                <PageHeader
                    breadcrumbs={[
                        { label: "Sessions", href: "/sessions" },
                        { label: sessionId, href: `/sessions/${sessionId}` },
                        { label: "Chats" },
                    ]}
                />

                <div className="h-[calc(100vh-4rem)] overflow-hidden">
                    <ResizablePanelGroup
                        direction="horizontal"
                        className="h-full"
                    >
                        <ResizablePanel
                            defaultSize={35}
                            minSize={25}
                            maxSize={45}
                        >
                            <ChatList
                                session={sessionId}
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
                                        session={sessionId}
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
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
