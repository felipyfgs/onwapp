# AGENTS.md - Documentação do Projeto ONWApp

## Visão Geral do Projeto

**ONWApp** é uma aplicação web full-stack construída com Next.js (TypeScript) no frontend e Go no backend. O sistema fornece uma interface de dashboard completa para gerenciar chats, conexões e contatos.

### Stack Tecnológica

**Frontend:**
- **Framework:** Next.js 16.1.0 (Turbopack)
- **Linguagem:** TypeScript
- **UI Library:** shadcn/ui + Tailwind CSS
- **Componentes:** Radix UI
- **Ícones:** Lucide React

**Backend:**
- **Linguagem:** Go
- **Estrutura:** Estrutura modular com cmd/server, internal/config, internal/db

## Estrutura do Projeto

```
/home/obsidian/onwapp/
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   ├── internal/
│   │   ├── config/
│   │   └── db/
│   └── go.mod
└── frontend/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx (Home)
    │   └── dashboard/
    │       ├── page.tsx (Overview)
    │       ├── chats/
    │       │   └── page.tsx
    │       ├── connections/
    │       │   └── page.tsx
    │       └── contacts/
    │           └── page.tsx
    ├── components/
    │   ├── app-sidebar.tsx
    │   ├── nav-main.tsx
    │   ├── nav-projects.tsx
    │   ├── nav-user.tsx
    │   ├── team-switcher.tsx
    │   ├── dashboard/
    │   │   ├── stats-cards.tsx
    │   │   └── overview-tabs.tsx
    │   ├── chats/
    │   │   └── chat-list.tsx
    │   ├── connections/
    │   │   └── connection-list.tsx
    │   ├── contacts/
    │   │   └── contact-list.tsx
    │   └── ui/
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── breadcrumb.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── collapsible.tsx
    │       ├── dropdown-menu.tsx
    │       ├── input.tsx
    │       ├── separator.tsx
    │       ├── sheet.tsx
    │       ├── sidebar.tsx
    │       ├── skeleton.tsx
    │       ├── tabs.tsx
    │       └── tooltip.tsx
    ├── hooks/
    │   └── use-mobile.ts
    ├── lib/
    │   └── utils.ts
    ├── public/
    ├── components.json
    ├── eslint.config.mjs
    ├── next-env.d.ts
    ├── next.config.ts
    ├── package.json
    ├── postcss.config.mjs
    ├── README.md
    └── tsconfig.json
```

## Páginas e Rotas

### Páginas Públicas
- `/` - Página inicial (Home)

### Páginas do Dashboard
- `/dashboard` - Visão geral com estatísticas e tabs
- `/dashboard/chats` - Lista de conversas
- `/dashboard/connections` - Lista de conexões
- `/dashboard/contacts` - Lista de contatos

### Rotas Planejadas (não implementadas)
- `/dashboard/analytics` - Analytics
- `/dashboard/reports` - Relatórios
- `/dashboard/chats/active` - Conversas ativas
- `/dashboard/chats/archived` - Conversas arquivadas
- `/dashboard/connections/api` - Chaves API
- `/dashboard/connections/webhooks` - Webhooks
- `/dashboard/contacts/groups` - Grupos de contatos
- `/dashboard/contacts/import` - Importação
- `/dashboard/settings` - Configurações
- `/dashboard/help` - Central de ajuda
- `/dashboard/profile` - Perfil do usuário

## Componentes Principais

### Dashboard Components
- **StatsCard / StatsGrid**: Cards de estatísticas (Chats, Connections, Contacts)
- **OverviewTabs**: Tabs para Overview, Analytics, Reports

### Chats Components
- **ChatList**: Lista de conversas com cards
- **ChatHeader**: Cabeçalho com botão "New Chat"

### Connections Components
- **ConnectionList**: Lista de conexões com status (Active, Pending, Error)
- **ConnectionHeader**: Cabeçalho com botão "Add Connection"

### Contacts Components
- **ContactList**: Lista de contatos com avatares
- **ContactHeader**: Cabeçalho com botão "Add Contact" e input de busca

### UI Components (shadcn/ui)
- **Sidebar**: Barra lateral com navegação
- **Card**: Cards de conteúdo
- **Tabs**: Abas de navegação
- **Button**: Botões
- **Input**: Inputs de texto
- **Badge**: Badges de status
- **Avatar**: Avatares de usuário
- **Breadcrumb**: Navegação por migalhas
- **Separator**: Separadores visuais

## Dados de Exemplo

### Usuário Padrão
```typescript
{
  name: "Admin User",
  email: "admin@onwapp.com",
  avatar: "/avatars/admin.jpg"
}
```

### Equipe
```typescript
{
  name: "ONWApp",
  logo: GalleryVerticalEnd,
  plan: "Pro"
}
```

### Estatísticas (Dashboard)
- Total Chats: 127
- Connections: 45
- Contacts: 892

### Chats (Mock Data)
- Support Chat (2 min ago)
- Sales Inquiry (15 min ago)
- Technical Support (1 hour ago)
- General Inquiry (3 hours ago)
- Billing Question (5 hours ago)
- Feedback (1 day ago)

### Connections (Mock Data)
- API Integration (Active)
- Webhook Service (Pending)
- Database Sync (Active)
- Cloud Storage (Error)

### Contacts (Mock Data)
- John Doe (Acme Corp - Manager)
- Sarah Miller (TechStart - CEO)
- Mike Rodriguez (Innovate Inc - Developer)
- Emily Wang (Design Co - Product Lead)
- David Kim (DataFlow - Analyst)
- Lisa Park (CloudNet - VP Engineering)

## Comandos Úteis

### Instalação e Setup
```bash
cd frontend
npm install
```

### Adicionar Componentes shadcn/ui
```bash
npx shadcn@latest add [componente]
# Exemplos:
npx shadcn@latest add card tabs badge avatar
npx shadcn@latest add sidebar-07
```

### Desenvolvimento
```bash
cd frontend
npm run dev
```

### Build
```bash
cd frontend
npm run build
```

## Padrões de Código

### Estrutura de Componentes
```typescript
"use client"

import { dependencies } from "@/components/ui/[component]"

interface ComponentProps {
  // Props definidas aqui
}

export function ComponentName({ props }: ComponentProps) {
  return (
    // JSX aqui
  )
}
```

### Nomenclatura
- Componentes: PascalCase (`ChatList`, `StatsCard`)
- Arquivos: kebab-case (`chat-list.tsx`, `stats-cards.tsx`)
- Funções: camelCase (`getChats`, `fetchData`)

### Imports
- Componentes UI: `@/components/ui/[component]`
- Componentes específicos: `@/components/[categoria]/[component]`
- Hooks: `@/hooks/[hook]`
- Utils: `@/lib/utils`

## Configurações

### Tailwind CSS
- Configurado em `tailwind.config.ts`
- Tema customizado com cores do shadcn/ui

### TypeScript
- `tsconfig.json` com paths configurados
- Strict mode ativado

### ESLint
- Configurado em `eslint.config.mjs`
- Base Next.js + TypeScript

## Estilização

### Cores Principais
- Background: `bg-zinc-50` / `bg-black` (dark)
- Foreground: `text-zinc-950` / `text-zinc-50` (dark)
- Muted: `bg-muted/50`
- Border: `border-zinc-200` / `border-zinc-800` (dark)

### Spacing
- Padding: `p-4`, `pt-0`, `px-4`
- Gap: `gap-2`, `gap-4`
- Margin: `-ml-1`, `mr-2`

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px

## Fluxo de Usuário

1. **Login** → Acessa `/dashboard`
2. **Dashboard** → Visão geral com estatísticas
3. **Navegação** → Sidebar com links para:
   - Chats
   - Connections
   - Contacts
4. **Ações** → Botões específicos em cada página:
   - New Chat
   - Add Connection
   - Add Contact
   - Search Contacts

## Próximos Passos

### Funcionalidades a Implementar
- [ ] Autenticação real (Login/Logout)
- [ ] Conexão com API backend Go
- [ ] CRUD real para Chats
- [ ] CRUD real para Connections
- [ ] CRUD real para Contacts
- [ ] Página de Analytics
- [ ] Página de Reports
- [ ] Página de Settings
- [ ] Página de Help
- [ ] Página de Profile
- [ ] Integração com WebSocket para chats em tempo real
- [ ] Notificações
- [ ] Exportação de dados

### Melhorias
- [ ] Loading states com Skeleton
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] Modal dialogs
- [ ] Confirmação de ações
- [ ] Validação de formulários
- [ ] Paginação
- [ ] Filtros e ordenação
- [ ] Dark mode toggle

## Notas Importantes

1. **Sidebar**: Utiliza `shadcn/ui sidebar` (versão 0.7)
2. **Turbopack**: Next.js 16 usa Turbopack para build rápido
3. **Mock Data**: Dados atuais são estáticos/mocks
4. **Sem Backend**: Ainda não há integração real com API
5. **Mobile**: Hook `use-mobile.ts` detecta viewport
6. **Assets**: Avatares em `/public/avatars/`

## URLs e Referências

- **shadcn/ui**: https://ui.shadcn.com
- **Next.js**: https://nextjs.org
- **Lucide Icons**: https://lucide.dev
- **Tailwind CSS**: https://tailwindcss.com

---

**Documentação mantida por:** Equipe ONWApp  
**Última atualização:** 18/12/2025
