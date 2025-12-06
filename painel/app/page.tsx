import Link from "next/link";
import { MessageSquare, BarChart3, Zap, Shield, ArrowRight } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Gestão de Conversas",
    description: "Centralize todas as conversas do WhatsApp em um único painel de controle.",
  },
  {
    icon: Zap,
    title: "Automação Inteligente",
    description: "Configure respostas automáticas e fluxos de atendimento personalizados.",
  },
  {
    icon: BarChart3,
    title: "Métricas em Tempo Real",
    description: "Acompanhe o desempenho do atendimento com dashboards detalhados.",
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Dados criptografados e conformidade com LGPD garantida.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">OnwApp</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Acessar Painel
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center md:py-32">
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Gerencie seu{" "}
            <span className="text-primary">WhatsApp Business</span>{" "}
            de forma profissional
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Plataforma completa para gestão de conversas, automação de respostas
            e análise de métricas do seu atendimento via WhatsApp.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Começar Agora
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sessions"
              className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Ver Sessões
            </Link>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Recursos Principais
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <feature.icon className="mb-4 h-10 w-10 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">Pronto para começar?</h2>
            <p className="mb-8 text-muted-foreground">
              Acesse o painel e comece a gerenciar suas conversas agora mesmo.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Acessar Painel
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} OnwApp. Todos os direitos reservados.
          </p>
          <nav className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Termos de Uso
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Privacidade
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
