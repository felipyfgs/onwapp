"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  X, 
  Keyboard, 
  MousePointer, 
  Zap, 
  Search, 
  MessageSquare, 
  Users, 
  Settings,
  ChevronRight,
  Star,
  Book,
  Video,
  Github,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

interface FeatureItem {
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  action?: () => void;
}

const shortcuts: ShortcutItem[] = [
  {
    keys: ["Ctrl", "K"],
    description: "Abrir busca global",
    category: "Navegação"
  },
  {
    keys: ["Ctrl", "/"],
    description: "Mostrar atalhos",
    category: "Navegação"
  },
  {
    keys: ["Ctrl", "1"],
    description: "Ir para tickets abertos",
    category: "Tickets"
  },
  {
    keys: ["Ctrl", "2"],
    description: "Ir para tickets resolvidos",
    category: "Tickets"
  },
  {
    keys: ["Ctrl", "3"],
    description: "Ir para busca",
    category: "Tickets"
  },
  {
    keys: ["Esc"],
    description: "Fechar modal/busca",
    category: "Geral"
  },
  {
    keys: ["Tab"],
    description: "Navegar entre elementos",
    category: "Geral"
  },
  {
    keys: ["Enter"],
    description: "Confirmar ação",
    category: "Geral"
  }
];

const features: FeatureItem[] = [
  {
    title: "Dashboard Inteligente",
    description: "Visualize métricas em tempo real e ações rápidas",
    icon: Star,
    badge: "Novo",
    action: () => {}
  },
  {
    title: "Busca Global",
    description: "Encontre qualquer coisa em qualquer lugar",
    icon: Search,
    action: () => {}
  },
  {
    title: "Sistema de Tickets",
    description: "Gerencie atendimentos com filtros inteligentes",
    icon: MessageSquare,
    action: () => {}
  },
  {
    title: "Gestão de Sessões",
    description: "Multiple contas WhatsApp com status em tempo real",
    icon: Users,
    action: () => {}
  },
  {
    title: "Notificações Inteligentes",
    description: "Alertas contextuais e não intrusivos",
    icon: Zap,
    action: () => {}
  },
  {
    title: "Configurações Avançadas",
    description: "Personalize sua experiência",
    icon: Settings,
    action: () => {}
  }
];

const resources = [
  {
    title: "Documentação",
    description: "Guia completo de uso da plataforma",
    icon: Book,
    url: "/docs"
  },
  {
    title: "Video Tutoriais",
    description: "Aprenda com vídeos passo a passo",
    icon: Video,
    url: "/tutorials"
  },
  {
    title: "GitHub",
    description: "Código fonte e contribuições",
    icon: Github,
    url: "https://github.com/felipyfgs/onwapp"
  },
  {
    title: "Suporte",
    description: "Entre em contato com nossa equipe",
    icon: Mail,
    url: "mailto:suporte@onwapp.com"
  }
];

export function HelpModal({ open, onOpenChange }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<"shortcuts" | "features" | "resources">("shortcuts");

  const handleResourceClick = (url: string) => {
    if (url.startsWith("http")) {
      window.open(url, "_blank");
    } else {
      window.location.href = url;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Ajuda e Atalhos
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          {/* Tabs */}
          <div className="flex gap-1 p-1 border-b">
            {[
              { id: "shortcuts", label: "Atalhos", icon: Keyboard },
              { id: "features", label: "Recursos", icon: Star },
              { id: "resources", label: "Recursos", icon: Book }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "shortcuts" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Atalhos de Teclado</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Use estes atalhos para navegar mais rapidamente pela plataforma
                  </p>
                </div>
                
                {Object.entries(
                  shortcuts.reduce((acc, shortcut) => {
                    if (!acc[shortcut.category]) {
                      acc[shortcut.category] = [];
                    }
                    acc[shortcut.category].push(shortcut);
                    return acc;
                  }, {} as Record<string, ShortcutItem[]>)
                ).map(([category, items]) => (
                  <div key={category} className="mb-6">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {items.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              {shortcut.keys.map((key, keyIndex) => (
                                <kbd
                                  key={keyIndex}
                                  className="px-2 py-1 text-xs font-mono bg-muted border rounded"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                            <span className="text-sm">{shortcut.description}</span>
                          </div>
                          <MousePointer className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === "features" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recursos da Plataforma</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Conheça as principais funcionalidades disponíveis
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <Card
                        key={index}
                        className="group cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
                        onClick={feature.action}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base">{feature.title}</CardTitle>
                              {feature.badge && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {feature.badge}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3 group-hover:bg-primary group-hover:text-primary-foreground"
                            onClick={feature.action}
                          >
                            Saiba mais
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
            
            {activeTab === "resources" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recursos e Ajuda</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Material para ajudar você a tirar o máximo da plataforma
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {resources.map((resource, index) => {
                    const Icon = resource.icon;
                    return (
                      <Card
                        key={index}
                        className="group cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
                        onClick={() => handleResourceClick(resource.url)}
                      >
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{resource.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {resource.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}