# Onwapp - Guia de Referência para Agentes de IA (AGENTS.md)

Este arquivo serve como guia de referência global para agentes de IA que operam no projeto **Onwapp** - uma plataforma multi-tenant de atendimento ao cliente via WhatsApp.

## 📋 Visão Geral do Projeto
- **Missão:** Plataforma multi-tenant de atendimento ao cliente via WhatsApp
- **Status:** Em desenvolvimento - autenticação e estrutura base implementadas
- **Schema do BD:** Migrations completas para tenants, users, tickets, contacts, queues, messages, sessions

## 🏗️ Stack Tecnológica & Arquitetura

### Backend (Go)
```bash
# Comandos essenciais
cd backend
go run cmd/server/main.go          # Rodar servidor
go build ./...                     # Compilar
go test ./...                      # Testes
go mod tidy                        # Gerenciamento de dependências
```

- **Framework:** Fiber v2
- **Banco de Dados:** PostgreSQL com pgx/v5
- **Mensageria:** NATS (JetStream)
- **WhatsApp:** whatsmeow
- **Padrão:** Clean Architecture (Handlers → Services → Repositories → Models)
- **Validação:** go-playground/validator/v10
- **Logging:** zerolog

### Frontend (Next.js)
```bash
# Comandos essenciais
cd frontend
npm run dev                        # Desenvolvimento
npm run build                      # Build
npm run lint                       # Lint
```

- **Framework:** Next.js 14 (App Router)
- **Estilização:** Tailwind CSS + shadcn/ui
- **Estado:** Zustand com persist
- **API:** Axios
- **Comunicação:** REST + WebSocket (NATS)

## 📚 Linguagem de Domínio (Glossário)

| Termo | Definição |
|-------|-----------|
| **Tenant** | Empresa/organização isolada no sistema |
| **Messaging Session** | Conexão ativa com conta WhatsApp |
| **Ticket** | Atendimento em curso entre atendente e contato |
| **Queue** | Fila de atendimento para distribuição de tickets |
| **Contact** | Cliente final que envia mensagens via WhatsApp |

## 🤖 Personas de Agentes & Responsabilidades

### Architect Agent
- **Foco:** Design de sistema, escalabilidade, padrões
- **Responsabilidade:** Validar Clean Architecture, multi-tenancy, event-driven design
- **Critérios:** 
  - Toda DB query tem `tenant_id`
  - Handlers dependem de Services, não de Repositories diretamente
  - Eventos NATS para operações assíncronas

### Code Agent
- **Foco:** Implementação, legibilidade, testabilidade
- **Responsabilidade:** Escrever código Go/TypeScript seguindo SOLID/DRY
- **Critérios:**
  - Go: nomes descritivos, manipulação de erros explícita
  - TypeScript: tipagem estrita, componentes reutilizáveis
  - Nunca expor secrets ou chaves

### Debug Agent
- **Foco:** Diagnóstico, logs, correções seguras
- **Responsabilidade:** Identificar falhas em fluxos assíncronos (NATS/WhatsApp)
- **Critérios:**
  - Sempre usar zerolog para logs estruturados
  - Validar integração NATS antes de alterar lógica
  - Testar fluxo completo: message → ticket → response

## 🛠️ Padrões de Código

### Backend (Go) - REGRAS CRÍTICAS

#### Multi-tenancy (PRIORIDADE 1)
```go
// ✅ CORRETO - Sempre incluir tenant_id
func (r *Repository) GetByTenant(ctx context.Context, tenantID uuid.UUID) ([]Model, error) {
    query := `SELECT * FROM table WHERE tenant_id = $1`
    // ...
}

// ❌ ERRADO - Sem isolamento
func (r *Repository) GetAll() ([]Model, error) {
    query := `SELECT * FROM table`  // FALHA DE SEGURANÇA
}
```

#### Fluxo da Clean Architecture
```
HTTP Request 
    ↓
Handler (Fiber) 
    ↓
Service (Business Logic) 
    ↓
Repository (DB) 
    ↓
Model (Data)
```

- **Nunca** usar Repository direto no Handler
- **Sempre** validar inputs com validator
- **Sempre** retornar erros com contexto

#### Exemplo Handler Correto
```go
func (h *AuthHandler) Login(c *fiber.Ctx) error {
    var req struct {
        Email    string `json:"email" validate:"required,email"`
        Password string `json:"password" validate:"required,min=8"`
    }
    
    if err := c.BodyParser(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Corpo da requisição inválido",
        })
    }
    
    if err := validator.Validate.Struct(req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": err.Error(),
        })
    }
    
    user, token, err := h.service.Login(c.Context(), req.Email, req.Password)
    if err != nil {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "Credenciais inválidas",
        })
    }
    
    return c.JSON(fiber.Map{"user": user, "token": token})
}
```

#### Padrão Repository
```go
type TicketRepository struct {
    db *pgx.Conn
}

func (r *TicketRepository) Create(ctx context.Context, ticket *models.Ticket) error {
    // CRÍTICO: Sempre incluir tenant_id
    query := `
        INSERT INTO tickets (id, tenant_id, contact_id, status, created_at)
        VALUES ($1, $2, $3, $4, $5)
    `
    _, err := r.db.Exec(ctx, query,
        ticket.ID,
        ticket.TenantID,  // Sempre presente!
        ticket.ContactID,
        ticket.Status,
        time.Now(),
    )
    return err
}

// Listar tickets de um tenant específico
func (r *TicketRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.Ticket, error) {
    query := `SELECT * FROM tickets WHERE tenant_id = $1 ORDER BY created_at DESC`
    // ...
}
```

### Frontend (TypeScript/Next.js)

#### Estrutura de Componentes
```typescript
// ✅ CORRETO
'use client'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Button } from '@/components/ui/button'

export function LoginComponent() {
  const { login, isLoading } = useAuthStore()
  // ...
}
```

#### Padrão Zustand Store
```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // state
      user: null,
      token: null,
      
      // actions
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login(credentials)
          set({ user: response.user, token: response.token, isAuthenticated: true })
          localStorage.setItem('authToken', response.token)
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },
    }),
    { name: 'auth-storage' }
  )
)
```

#### Client API com Interceptores
```typescript
export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

## ⚙️ Configuração de Ambiente

### Backend (.env)
```env
PORT=:8080
DATABASE_URL=postgres://user:pass@localhost:5432/onwapp
JWT_SECRET=sua-secreta-aqui
JWT_EXPIRATION=15m
NATS_URL=nats://localhost:4222
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Docker Compose (Database & NATS)
```bash
docker-compose up -d postgres nats
```

## 🔧 Fluxo de Desenvolvimento

### 1. Fase de Análise (SEMPRECOMEÇAR AQUI)
```bash
# Antes de codificar, explore o contexto:
# Use Grep para achar padrões existentes
Grep "UserRepository" backend/internal
LS backend/internal/handlers

# Estude models e repositories primeiro
Read backend/internal/models/user.go
Read backend/internal/db/repository/user_repo.go
```

### 2. Planejamento com TODO List
```bash
# Crie TODO list antes de implementar
1. [ ] Entender problema e contexto existente
2. [ ] Identificar mudanças necessárias
3. [ ] Implementar incrementamente
4. [ ] Testar cada etapa
5. [ ] Atualizar documentação
```

### 3. Regras de Implementação
- **Mudanças incrementais**: Uma feature por PR
- **Testar sempre**: `go test ./...` e `npm run lint`
- **Commit message**: `<scope>: <action>` (ex: `feat(auth): add JWT refresh`)
- **Preview**: Rode servidor antes de finalizar

### 4. Erros Comuns a Evitar
```
❌ Não misturar tenant_id em queries
❌ Não usar variáveis de ambiente no código
❌ Não ignorar erros de validação
❌ Não chamar repositories diretamente dos handlers
❌ Não expor secrets em logs
❌ Não fazer PR sem testar localmente
❌ Não esquecer de rollback em migrations (arquivo .down.sql)
```

## 📦 Migrations de Database

```bash
# Backend - migrations
cd backend/internal/db/migrations

# Estrutura:
000001_create_tenants.up.sql
000001_create_tenants.down.sql
000002_create_users.up.sql
...
```

**Padrão de migration:**
```sql
-- up.sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    contact_id UUID NOT NULL REFERENCES contacts(id),
    queue_id UUID REFERENCES queues(id),
    user_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- down.sql
DROP TABLE IF EXISTS tickets;
```

## 🔐 Checklist de Segurança

- [ ] **CRÍTICO**: Todas as DB queries incluem `tenant_id`
- [ ] Validação de input no backend (mesmo com frontend validado)
- [ ] JWT secrets em variáveis de ambiente (nunca hardcode)
- [ ] Rate limiting em endpoints públicos
- [ ] Sanitização de inputs para SQL injection
- [ ] HTTPS only em produção
- [ ] Nenhum segredo em logs ou erros

## 🎯 Checklist de Code Review

### Backend
- [ ] Handler usa Service, não Repository
- [ ] Tenant isolation implemented
- [ ] Error handling com contexto
- [ ] Validator tags present
- [ ] NATS events published when needed
- [ ] Logs estruturados com zerolog
- [ ] Tests cover happy path e erros

### Frontend
- [ ] Uses Zustand for state
- [ ] shadcn/ui components
- [ ] Proper error handling
- [ ] Loading states implemented
- [ ] API calls via axios client with interceptors
- [ ] Types strict (no `any`)

## 🚀 Comandos de Referência

### Setup & Desenvolvimento
```bash
# Backend
cd backend
go run cmd/server/main.go

# Frontend
cd frontend
npm run dev

# Database
docker-compose up -d postgres nats
```

### Testes & Qualidade
```bash
# Backend
go test ./...
go vet ./...
go build ./...

# Frontend
npm run lint
npm run build
```

### Database
```bash
# Rodar migrations
migrate -path backend/internal/db/migrations -database "postgres://..." up

# Criar nova migration
migrate create -ext sql -dir backend/internal/db/migrations -seq create_tickets_table
```

## 📝 Diretrizes de PR

### Formato do Título
```
<type>(<scope>): <description>

Exemplos:
feat(auth): add registration endpoint
fix(whatsapp): fix QR code generation
refactor(ticket): improve performance
test(auth): add login tests
```

### Template de Descrição do PR
```
## O que mudou
Descrição breve

## Porquê
Problema sendo resolvido

## Como
Abordagem técnica

## Testes
- [ ] Testes manuais completos
- [ ] Unit tests passaram
- [ ] Fluxo de integração verificado

## Segurança
- [ ] Tenant isolation verificado
- [ ] Nenhum segredo exposto
- [ ] Validação de input adicionada
```

### Formato do Commit
```bash
git commit -m "feat: add user registration with validation

- Implement registration handler with JWT generation  
- Add password hashing with bcrypt
- Validate multi-tenancy in service layer

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"
```

### Pré-Commit Checklist
```bash
# Rodar antes de cada commit
cd backend && go test ./... && go vet ./...
cd frontend && npm run lint
git diff --cached  # Revise TODAS as mudanças
```

## 🎯 Critérios de Sucesso

Cada tarefa está completa quando:
- ✅ Code compila sem erros (`go build ./...` / `npm run build`)
- ✅ Todos os testes passam (`go test ./...` / `npm run lint`)
- ✅ Multi-tenancy verificado (toda query tem `tenant_id`)
- ✅ Documentação atualizada (AGENTS.md se necessário)
- ✅ Testes manuais bem-sucedidos (servidor roda, features funcionam)
- ✅ Nenhum segredo exposto (`git diff --cached` review)

## 📊 Exemplo: Fluxo Completo de Ticket

### Passo 1: Mensagem WhatsApp Recebida
```
WhatsApp → whatsmeow → NATS event "message.received"
```

### Passo 2: Encontrar/Criar Contato
```go
// Service layer
func (s *TicketService) ProcessIncomingMessage(msg *events.Message, sessionID uuid.UUID) error {
    // 1. Find or create contact by WhatsApp ID
    contact, err := s.contactRepo.FindByWhatsAppID(ctx, msg.Info.Sender.String())
    if err != nil {
        contact = &models.Contact{
            ID: uuid.New(),
            TenantID: session.TenantID,  // Herda tenant da session
            WhatsAppID: msg.Info.Sender.String(),
            Name: msg.Info.PushName,
        }
        s.contactRepo.Create(ctx, contact)
    }
    
    // 2. Find existing open ticket or create new
    ticket, err := s.ticketRepo.FindOpenByContact(ctx, contact.ID)
    if err != nil {
        ticket = &models.Ticket{
            ID: uuid.New(),
            TenantID: contact.TenantID,  // CRÍTICO: tenant isolation
            ContactID: contact.ID,
            Status: "open",
        }
        s.ticketRepo.Create(ctx, ticket)
    }
    
    // 3. Save message
    message := &models.Message{
        ID: uuid.New(),
        TicketID: ticket.ID,
        WhatsAppMsgID: msg.Info.ID,
        Body: msg.Message.GetConversation(),
        FromMe: false,
    }
    s.messageRepo.Create(ctx, message)
    
    // 4. Publish NATS event
    s.natsClient.Publish("tickets.new", EventTicketCreated, map[string]interface{}{
        "ticket_id": ticket.ID,
        "tenant_id": ticket.TenantID,
    })
    
    return nil
}
```

### Passo 3: Agente Responde
```typescript
// Frontend
const sendMessage = async (ticketId: string, text: string) => {
  const response = await apiClient.post(`/api/v1/messages/send`, {
    ticket_id: ticketId,
    body: text,
  })
  
  // NATS WebSocket recebe update em tempo real
  // Outros agentes veem ticket atualizado
}
```

## 🔍 Dicas de Debug

### Problemas no Backend
```bash
# Ver logs
tail -f logs/app.log

# Testar conexão com banco
psql $DATABASE_URL -c "SELECT 1"

# Verificar NATS
nats server report
```

### Problemas no Frontend
```bash
# Ver network
curl -v http://localhost:8080/health

# Debug state
console.log(useAuthStore.getState())
```

## 🚨 Procedimentos de Emergência

### Se Brecha de Multi-tenancy Detectada
1. **PARE** todo desenvolvimento imediatamente
2. Revise `git log --all` por mudanças recentes
3. Verifique todas queries: `grep -r "SELECT.*FROM" backend/internal/db`
4. Adicione testes para tenant isolation
5. Deploy correção em até 1 hora

### Se Secret Exposto
1. Rotacione secret imediatamente
2. Atualize arquivos .env
3. Verifique Git history: `git log -p | grep -i "secret"`
4. Adicione git pre-commit hook
5. Documente incidente

---
*Este documento é mantido por humanos e IAs para o sucesso do Onwapp. Última atualização: 2025-12-18*
