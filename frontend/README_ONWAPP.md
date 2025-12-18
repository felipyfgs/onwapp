# Onwapp Frontend - Guia de Integração

Este frontend foi projetado para funcionar com o backend Go do Onwapp. Ele usa Next.js 14 com App Router, Tailwind CSS e shadcn/ui.

## Estrutura Atual

✅ **Implementado:**
- Sistema de autenticação com login/register (com mock para desenvolvimento)
- Layout de dashboard com sidebar
- Páginas principais: Dashboard, Chats, Contatos, Conexões, Filas, Configurações
- Componentes shadcn/ui básicos
- Zustand para state management

🔄 **Para conectar ao backend Go:**

## Backend Go Disponível

O backend Go em `/backend` tem os seguintes endpoints:

### Auth (✅ Implementado)
```
POST /api/v1/auth/login
POST /api/v1/auth/register  
POST /api/v1/auth/validate
```

### Tenants (✅ Implementado)
```
GET    /api/v1/tenants
GET    /api/v1/tenants/:id
POST   /api/v1/tenants
PUT    /api/v1/tenants/:id
DELETE /api/v1/tenants/:id
```

### Outros Endpoints (🔄 Necessário implementar handlers)
- Tickets (`/api/v1/tickets`)
- Contacts (`/api/v1/contacts`)
- Sessions (`/api/v1/sessions`)
- Queues (`/api/v1/queues`)
- Messages (`/api/v1/messages`)

## Como Conectar

### 1. Ativar API Real

Edite `lib/stores/auth-store.ts` e remova o mock:
```typescript
// Remover:
// const mockLogin = async () => { ... }

// Usar apiClient real:
import { apiClient } from "@/lib/api/client"

// No login:
const response = await apiClient.post("/auth/login", credentials)
const { user, token } = response.data
```

### 2. Criar Client API

Edite `lib/api/client.ts` para usar axios ou fetch com o backend:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
})
```

### 3. Adicionar Novos Endpoints

Crie handlers no backend Go para:
- `GET /api/v1/tickets` - Listar tickets
- `GET /api/v1/contacts` - Listar contatos  
- `POST /api/v1/sessions` - Criar sessão WhatsApp
- `GET /api/v1/queues` - Listar filas

Exemplo de handler Go para tickets:
```go
func (h *TicketHandler) ListTickets(c *fiber.Ctx) error {
    tenantID := c.Locals("tenant_id").(uuid.UUID)
    tickets, err := h.service.ListByTenant(c.Context(), tenantID)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to list tickets",
        })
    }
    return c.JSON(tickets)
}
```

### 4. Atualizar Frontend

Nas páginas do dashboard, substitua os dados mock por chamadas reais:

```typescript
// Em dashboard/chats/page.tsx
const loadTickets = async () => {
  try {
    const response = await apiClient.get("/tickets")
    setTickets(response.data)
  } catch (error) {
    console.error("Erro ao carregar tickets:", error)
  }
}
```

## Comandos de Desenvolvimento

```bash
# Backend Go
cd backend
go run cmd/server/main.go

# Frontend Next.js
cd frontend  
npm run dev
```

## URLs de Desenvolvimento

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Health Check: http://localhost:8080/health

## Próximos Passos

1. **Imediato:** Implementar endpoint de tickets no backend
2. **Curto prazo:** Criar endpoints de contacts, sessions, queues
3. **Médio prazo:** Conectar WebSocket/NATS para mensagens em tempo real
4. **Longo prazo:** Adicionar relatórios e analytics

## Fluxo de Autenticação

1. Usuário faz login/register
2. Backend retorna JWT token
3. Frontend salva token no localStorage
4. Todas as próximas requisições incluem `Authorization: Bearer {token}`
5. Middleware do backend valida tenant_id e permissões

## Multi-tenancy

O backend Go já implementa multi-tenancy com `tenant_id`. No frontend, após login:
- `user.tenant_id` está disponível na store
- Todos os requests devem ser scoped para este tenant
- O backend valida automaticamente o tenant do usuário logado
