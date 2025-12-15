'use client';

import { useParams, usePathname } from 'next/navigation';
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

function getBreadcrumbs(pathname: string, sessionId: string) {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; href?: string }[] = [
    { label: 'Sessions', href: '/sessions' },
    { label: sessionId, href: `/sessions/${sessionId}` },
  ];

  const segmentLabels: Record<string, string> = {
    messages: 'Mensagens',
    contacts: 'Contatos',
    groups: 'Grupos',
    profile: 'Perfil',
    media: 'Mídia',
    settings: 'Configurações',
    status: 'Status',
    newsletter: 'Newsletter',
    integrations: 'Integrações',
    webhooks: 'Webhooks',
    chatwoot: 'Chatwoot',
  };

  const sessionIndex = segments.indexOf(sessionId);
  const subSegments = segments.slice(sessionIndex + 1);

  subSegments.forEach((segment, index) => {
    const isLast = index === subSegments.length - 1;
    const label = segmentLabels[segment] || segment;
    const href = isLast ? undefined : `/sessions/${sessionId}/${subSegments.slice(0, index + 1).join('/')}`;
    breadcrumbs.push({ label, href });
  });

  return breadcrumbs;
}

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const sessionId = params.id as string;

  useSessionSubscription(sessionId);

  const breadcrumbs = getBreadcrumbs(pathname, sessionId);

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
                {breadcrumbs.map((crumb, index) => (
                  <span key={index} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                    <BreadcrumbItem className={index < breadcrumbs.length - 1 ? 'hidden md:block' : ''}>
                      {crumb.href ? (
                        <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}