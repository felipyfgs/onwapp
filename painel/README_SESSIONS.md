# Página de Sessões WhatsApp - OnWApp

Esta página foi criada seguindo exatamente o padrão do template em `painel/tamplate/`, mantendo a estrutura de sidebar dupla e componentes shadcn/ui.

## 📁 Estrutura Criada

```
painel/
├── app/sessions/
│   └── page.tsx                      # Página principal de sessões
├── components/
│   ├── app-sidebar.tsx               # ✏️ MODIFICADO - Navegação com sessões
│   └── sessions/
│       ├── sessions-stats.tsx        # Cards de estatísticas
│       ├── sessions-filters.tsx      # Filtros e busca
│       ├── sessions-table.tsx        # Tabela de sessões
│       ├── create-session-dialog.tsx # Dialog para criar sessão
│       └── qr-code-dialog.tsx        # Dialog para mostrar QR Code
├── lib/
│   ├── types/
│   │   └── session.ts                # Tipos TypeScript
│   └── api/
│       └── sessions.ts               # Client API
├── hooks/
│   └── use-mobile.ts                 # Hook do template (copiado)
└── .env.local                        # Variáveis de ambiente

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie ou edite o arquivo `.env.local`:

```bash
# URL da API Go backend
NEXT_PUBLIC_API_URL=http://localhost:8080

# API Key (opcional, deixe vazio se não usar auth)
NEXT_PUBLIC_API_KEY=
```

### 2. Instalar Dependências

```bash
cd painel
npm install
```

### 3. Iniciar o Backend

Certifique-se de que o backend Go está rodando na porta 8080:

```bash
cd ..
make run
# ou
go run cmd/onwapp/main.go
```

### 4. Iniciar o Frontend

```bash
cd painel
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 🎨 Funcionalidades

### Página de Sessões (`/sessions`)

- ✅ **Listagem de sessões** com status em tempo real
- ✅ **Estatísticas**: Total, Conectadas, Desconectadas, Mensagens, Chats, Contatos
- ✅ **Filtros**: Por status (todas/conectadas/conectando/desconectadas) e busca textual
- ✅ **Auto-refresh**: Atualização automática a cada 30 segundos
- ✅ **Criar sessão**: Dialog para criar nova sessão
- ✅ **Ações por sessão**:
  - Conectar/Desconectar
  - Ver QR Code (com polling automático)
  - Logout (limpa credenciais)
  - Reiniciar
  - Deletar
- ✅ **Toasts**: Feedback visual de todas as ações
- ✅ **Loading states**: Skeletons durante carregamento

### Sidebar

- ✅ **Navegação principal**:
  - Dashboard
  - Sessões
  - Configurações
- ✅ **Lista de sessões** no segundo sidebar:
  - Busca de sessões
  - Indicador de status (verde/amarelo/vermelho)
  - Estatísticas resumidas (mensagens, chats)
  - Badge com número de sessões conectadas

## 🔌 Endpoints da API

A aplicação consome os seguintes endpoints do backend Go:

```
GET    /sessions              # Lista todas as sessões
POST   /sessions              # Cria nova sessão
DELETE /:session              # Deleta uma sessão
GET    /:session/status       # Informações da sessão
POST   /:session/connect      # Conecta sessão
POST   /:session/disconnect   # Desconecta sessão
POST   /:session/logout       # Logout (limpa credenciais)
POST   /:session/restart      # Reinicia sessão
GET    /:session/qr           # Obtém QR Code
```

## 📝 Tipos TypeScript

### Session

```typescript
interface Session {
  id: string
  session: string
  deviceJid?: string
  phone?: string
  status: "connected" | "connecting" | "disconnected"
  apiKey?: string
  pushName?: string
  profilePicture?: string
  stats?: SessionStats
  createdAt: string
  updatedAt: string
}
```

### SessionStats

```typescript
interface SessionStats {
  messages: number
  chats: number
  contacts: number
  groups: number
}
```

## 🎯 Design Pattern (Seguindo Template)

- ✅ Layout com `SidebarProvider` + `AppSidebar` + `SidebarInset`
- ✅ Header fixo com breadcrumb navigation
- ✅ Grid responsivo (4 cols desktop → 2 tablet → 1 mobile)
- ✅ Componentes shadcn/ui puros
- ✅ Skeleton para loading states
- ✅ Toast notifications com sonner

## 🚀 Build para Produção

```bash
npm run build
npm start
```

## 📦 Componentes UI Utilizados

Todos os componentes foram instalados via shadcn/ui:

- `card` - Cards de estatísticas
- `badge` - Badges de status
- `dialog` - Dialogs de criar/QR Code
- `select` - Filtro de status
- `button` - Botões de ação
- `input` - Campo de busca
- `avatar` - Avatar do usuário
- `dropdown-menu` - Menu de ações
- `breadcrumb` - Navegação
- `sidebar` - Sidebar dupla
- `skeleton` - Loading states
- `separator` - Separadores visuais
- `tooltip` - Tooltips

## 🔄 Auto-refresh

A página atualiza automaticamente:
- Sessões na página: a cada 30s
- Sessões na sidebar: a cada 30s
- QR Code: a cada 3s (quando dialog aberto)

## ⚠️ Tratamento de Erros

- Se a API não estiver disponível, mostra mensagem amigável
- Se a criação de sessão falhar, mostra erro específico
- Se uma ação falhar, mostra toast de erro
- Loading states durante todas as operações assíncronas

## 📱 Responsividade

- Desktop: Sidebar dupla visível
- Tablet: Sidebar dupla com segundo sidebar oculto
- Mobile: Sidebar em overlay (abre/fecha com trigger)

## 🎨 Cores de Status

- 🟢 Verde: `connected`
- 🟡 Amarelo: `connecting`
- 🔴 Vermelho: `disconnected`

---

Desenvolvido seguindo fielmente o template em `painel/tamplate/`
