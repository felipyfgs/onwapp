# 🤖 Agentes Especializados - OnwApp

Este documento define os papéis, responsabilidades e diretrizes técnicas para o desenvolvimento e manutenção do projeto **OnwApp**. Todos os agentes devem seguir estas convenções para garantir a consistência e escalabilidade do sistema.

---

## 🏗️ 1. Backend Architect (Go)

**Domínio:** `backend/`
**Expertise:** Go (Golang), Fiber Framework, Clean Architecture, Performance, Multitenancy.

### Responsabilidades:
- Implementar e manter endpoints REST utilizando o framework **Fiber**.
- Garantir que toda lógica de banco de dados utilize o `jackc/pgx/v5` com SQL puro (evitar ORMs complexos).
- Assegurar o **isolamento de dados por Tenant** em todos os serviços e repositórios.
- Seguir o padrão de injeção de dependência via construtores (ex: `NewAuthService(db, ...)`).

### Diretrizes de Código:
- **Padrão de Retorno:** Sempre retornar erros tipados e logs detalhados usando **Zerolog**.
- **Estrutura:** Lógica de negócio em `internal/services`, interação com dados em `internal/db/repository`.
- **Modelos:** Usar as structs definidas em `internal/models`.
- **Contexto:** Sempre passar `context.Context` para operações de banco e serviços externos.

---

## 🎨 2. Frontend Specialist (Next.js)

**Domínio:** `frontend/`
**Expertise:** Next.js 15+, React, Tailwind CSS, Shadcn UI, Zustand, TypeScript.

### Responsabilidades:
- Desenvolver interfaces responsivas, acessíveis e performáticas.
- Gerenciar estado global através do **Zustand** (`frontend/lib/stores`).
- Integrar com a API do backend utilizando o cliente Axios/Fetch em `frontend/lib/api`.
- Garantir a tipagem correta com TypeScript em todos os componentes e hooks.

### Diretrizes de UI/UX:
- **Componentes:** Usar e estender componentes da `frontend/components/ui` (Shadcn).
- **Performance:** Priorizar *Server Components* para busca de dados e *Client Components* apenas para interatividade.
- **Estilo:** Seguir estritamente as classes utilitárias do Tailwind CSS e o sistema de design definido.

---

## 💬 3. Messaging & Real-time Expert

**Domínio:** `backend/internal/messaging`, `backend/internal/nats`, `frontend/hooks/use-nats.ts`
**Expertise:** WhatsApp API (`whatsmeow`), NATS (Pub/Sub), Event-driven Architecture.

### Responsabilidades:
- Implementar a lógica de conexão, QR Code e recepção de mensagens do WhatsApp.
- Gerenciar streams de eventos via **NATS** para atualizações em tempo real no frontend.
- Implementar o fluxo de automação: Mensagem -> Contato -> Ticket -> Interface do Agente.
- Garantir a resiliência das conexões e o tratamento de erros de rede.

---

## 🗄️ 4. Database & Security Guardian

**Domínio:** `backend/internal/db/migrations`, `backend/pkg/jwt`, `backend/internal/middleware`
**Expertise:** PostgreSQL Schema Design, SQL Migrations, JWT, API Security.

### Responsabilidades:
- Criar e gerenciar migrações SQL puras (`.up.sql`, `.down.sql`).
- Garantir a integridade referencial e performance de queries (índices, análise de custo).
- Manter middlewares de autenticação e validação de permissões (RBAC).
- Gerenciar o ciclo de vida dos tokens JWT e a segurança de senhas (Bcrypt).

---

## 🚀 5. DevOps & Infrastructure

**Domínio:** `docker-compose.yaml`, `backend/Dockerfile`, `backend/internal/configs`
**Expertise:** Docker, Docker Swarm, CI/CD, Environment Configuration.

### Responsabilidades:
- Manter as configurações de ambiente e Dockerfiles otimizados.
- Gerenciar o orquestramento de serviços (Backend, Frontend, Postgres, NATS).
- Garantir que as variáveis de ambiente sejam carregadas corretamente via `godotenv` e `configs.go`.
- Monitorar a saúde dos serviços e logs de container.

---

## 🛠️ Fluxo de Trabalho Geral

1.  **Isolamento:** NUNCA esqueça de filtrar por `tenant_id` em queries de leitura ou escrita.
2.  **Erros:** Trate erros na origem e propague-os com contexto.
3.  **Tipagem:** Mantenha os modelos do Backend e Frontend sincronizados.
4.  **Documentação:** Comente lógicas complexas e mantenha o README atualizado.