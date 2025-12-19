# Sistema de Tickets - Documentação

## ✅ Implementação Completa

### Componentes Criados/Modificados

1. **Tipos** (`/lib/nats/nats-types.ts`)
   - `Ticket` - Entidade principal com status, queue, assignedTo
   - `Queue` - Fila de tickets (Suporte, Vendas, Financeiro)
   - `User` - Usuário do sistema
   - `TicketMessage` - Mensagens de tickets

2. **TicketStatusBadge** (`/components/chats/ticket-status-badge.tsx`)
   - Badge colorido por status
   - Cores: open=verde, pending=amarelo, closed=cinza

3. **TicketActions** (`/components/chats/ticket-actions.tsx`)
   - Botões: Aceitar, Resolver, Reabrir
   - Mostra usuário atribuído
   - Lógica de permissões por status

4. **ChatSidebar** (refatorado)
   - Seção de filas no topo
   - Contadores open/pending por fila
   - Lista de tickets com busca
   - Design moderno com Tailwind

5. **Page** (`/app/dashboard/chats/page.tsx`)
   - Mock data completo: 3 filas, 6 tickets
   - Lógica de aceitar/resolver/reabrir tickets
   - Atribuição de tickets a usuários
   - Integração NATS para eventos

6. **ScrollArea** (`/components/ui/scroll-area.tsx`)
   - Componente shadcn/ui para scroll

### Funcionalidades

✅ **Filas (Queues)**
- Visualização de filas com ícones e contadores
- Suporte (🛠️), Vendas (💰), Financeiro (💳)
- Clique para selecionar fila

✅ **Status de Tickets**
- **Aberto** (verde) - Novo ticket não atribuído
- **Pendente** (amarelo) - Em atendimento
- **Fechado** (cinza) - Resolvido

✅ **Fluxo de Trabalho**
1. Ticket criado automaticamente → Status: open
2. Usuário clica "Aceitar" → Status: pending, atribuído ao usuário
3. Usuário clica "Resolver" → Status: closed
4. Opcional: "Reabrir" → Status: open novamente

✅ **Features**
- Busca de tickets por nome/mensagem
- Contadores de unread (badges vermelhas)
- Timestamps relativos ("há 2 horas")
- Responsivo
- Estados de loading prontos para NATS

### Estrutura de Dados

```typescript
Ticket {
  id: string
  contactName: string
  contactNumber: string
  lastMessage: string
  status: 'open' | 'pending' | 'closed'
  queue: Queue
  assignedTo?: User | null
  unreadCount: number
  createdAt: Date
  updatedAt: Date
}
```

### Eventos NATS

- `ticket.created` - Novo ticket via WhatsApp
- `ticket.updated` - Mudança de status/atribuição

### Mock Data

```
Tickets: 6 (2 Suporte, 2 Vendas, 2 Financeiro)
Status: 4 open, 1 pending, 1 closed
Usuários: Admin, Ana Rodrigues
```

### Próximos Passos (Backend)

Para completar a integração:

1. **API Endpoints (Go)**
   ```go
   GET  /api/tickets?queue=&status=
   POST /api/tickets/:id/accept
   POST /api/tickets/:id/resolve
   POST /api/tickets/:id/reopen
   GET  /api/queues
   ```

2. **NATS Subscribers (Go)**
   - Escutar novas mensagens do WhatsApp
   - Criar tickets automaticamente
   - Publicar eventos de atualização

3. **Banco de Dados**
   - Tabela tickets (id, status, queue_id, assigned_to)
   - Tabela queues (id, name, color, icon)
   - Tabela ticket_messages

### Testar

```bash
cd frontend
npm run dev

Abrir: http://localhost:3001/dashboard/chats
```

### Screenshots

A interface agora tem:
- ⬅️ Sidebar esquerda com filas e tickets
- ➡️ Área principal com actions e chat
- 🎨 Cores por status (verde/âmarelo/cinza)
- 👤 Indicação de usuário atribuído
- 🔢 Contadores por fila
- 🔍 Busca em tempo real