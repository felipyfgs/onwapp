'use client';

import { useParams } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSessionSubscription } from "@/hooks/use-session-subscription";
import { QRDisplay } from "@/components/session/qr-display";
import { ConnectionStatus } from "@/components/session/connection-status";
import { SessionActions } from "@/components/session/session-actions";

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  useSessionSubscription(sessionId);

  return (
    <SidebarProvider>
      <AppSidebar sessionId={sessionId} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/sessions">
                    Sessions
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{sessionId}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <QRDisplay />
            </div>
            <div className="flex flex-col gap-4">
              <ConnectionStatus />
              <SessionActions />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
