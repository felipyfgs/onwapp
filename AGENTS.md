# AGENTS.md

## Guia para Agentes de IA - Zpwoot WhatsApp API

Este projeto é uma API robusta para gerenciamento de sessões WhatsApp construída com NestJS (TypeScript), PostgreSQL e integração com Whaileys. Siga estas diretrizes para máxima produtividade e desenvolvimento eficiente.

---

## Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Setup de Desenvolvimento](#setup-de-desenvolvimento)
3. [Estrutura de Diretórios](#estrutura-de-diretórios)
4. [Endpoints da API](#endpoints-da-api)
5. [Módulos Core](#módulos-core)
6. [Integrações](#integrações)
7. [Banco de Dados](#banco-de-dados)
8. [Sistema de Eventos e Webhooks](#sistema-de-eventos-e-webhooks)
9. [Fluxos de Trabalho Essenciais](#fluxos-de-trabalho-essenciais)
10. [Padrões e Convenções](#padrões-e-convenções)
11. [Logging](#logging)
12. [Troubleshooting](#troubleshooting)

---

## Visão Geral da Arquitetura

### Stack Tecnológico
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| NestJS | 11.x | Framework backend |
| TypeScript | 5.7+ | Linguagem |
| PostgreSQL | 16 | Banco de dados |
| Prisma ORM | 7.x | ORM com adapter `@prisma/adapter-pg` |
| Whaileys | 6.4+ | WhatsApp Web API |
| Pino | 9.x | Logging estruturado |
| Swagger | 11.x | Documentação API |
| Axios | 1.13+ | HTTP Client |
| class-validator | 0.14+ | Validação de DTOs |
| fluent-ffmpeg | 2.1+ | Conversão de áudio |

### Dependências Principais
```json
{
  "@nestjs/common": "^11.0.1",
  "@nestjs/config": "^4.0.2",
  "@nestjs/swagger": "^11.2.3",
  "@nestjs/axios": "^4.0.1",
  "@prisma/client": "^7.0.0",
  "@prisma/adapter-pg": "^7.0.0",
  "whaileys": "^6.4.2",
  "pino": "^9.14.0",
  "class-validator": "^0.14.2",
  "@hapi/boom": "^10.0.1",
  "fluent-ffmpeg": "^2.1.3",
  "@ffmpeg-installer/ffmpeg": "^1.1.0"
}
```

### Principais Características
- Multi-sessões WhatsApp independentes
- 35 eventos de webhook suportados
- Integração bidirecional com Chatwoot
- Persistência completa de mensagens, contatos, chats e grupos
- Sincronização de histórico WhatsApp
- Suporte a 18+ tipos de mensagens
- Rastreamento de mensagens Chatwoot ↔ WhatsApp
- Reconexão automática de sessões
- Suporte a Newsletters/Canais
- Suporte a Comunidades
- Suporte a Labels (WhatsApp Business)
- Suporte a Catálogo de Produtos
- Gestão de Chamadas
- Conversão automática de áudio para PTT
- Suporte a Proxy por sessão
- API RESTful documentada com Swagger

---

## Setup de Desenvolvimento

### 1. Ambiente Docker
```bash
# Iniciar serviços
docker-compose up -d

# Verificar status
docker-compose ps
```

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| PostgreSQL | 5432 | Banco de dados principal |
| DBGate | 3001 | Interface web PostgreSQL |
| Webhook Tester | 8080 | Testar webhooks localmente |

### 2. Instalação
```bash
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

### 3. Scripts
```bash
npm run start:dev     # Desenvolvimento com watch
npm run start:debug   # Debug mode
npm run build         # Build produção
npm run start:prod    # Produção

npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage

npm run lint          # ESLint
npm run format        # Prettier

npx prisma studio     # Database GUI
npx prisma generate   # Gerar client
```

### 4. Variáveis de Ambiente
```env
DATABASE_URL=postgresql://zpwoot:zpwoot123@localhost:5432/zpwoot
PORT=3000
API_KEY=your-secret-api-key
SERVER_URL=http://localhost:3000
LOG_LEVEL=info
LOG_FORMAT=pretty
```

---

## Estrutura de Diretórios

```
src/
├── main.ts                          # Bootstrap
├── app.module.ts                    # Módulo raiz
│
├── api/                             # Endpoints REST
│   ├── sessions/                    # Sessões WhatsApp
│   ├── messages/                    # Envio de mensagens (18 tipos)
│   ├── chats/                       # Gestão de conversas
│   ├── contacts/                    # Gestão de contatos
│   ├── groups/                      # Gestão de grupos
│   ├── media/                       # Download/upload mídia
│   ├── presence/                    # Status de presença
│   ├── profile/                     # Perfil do usuário
│   ├── settings/                    # Configurações
│   ├── calls/                       # Gestão de chamadas
│   ├── newsletters/                 # Gestão de canais
│   ├── labels/                      # Gestão de labels
│   ├── communities/                 # Gestão de comunidades
│   └── business/                    # Catálogo de produtos
│
├── core/                            # Lógica principal
│   ├── whatsapp/                    # Integração Whaileys
│   │   ├── whatsapp.service.ts
│   │   ├── whatsapp.types.ts
│   │   ├── auth-state.ts
│   │   ├── managers/socket.manager.ts
│   │   ├── handlers/
│   │   │   ├── connection.handler.ts
│   │   │   ├── messages.handler.ts
│   │   │   ├── chats.handler.ts
│   │   │   ├── history.handler.ts
│   │   │   ├── contacts.handler.ts
│   │   │   ├── presence.handler.ts
│   │   │   ├── groups-persistence.handler.ts
│   │   │   ├── groups-extended.handler.ts
│   │   │   ├── calls.handler.ts
│   │   │   ├── labels.handler.ts
│   │   │   ├── newsletter.handler.ts
│   │   │   ├── blocklist.handler.ts
│   │   │   └── misc.handler.ts
│   │   └── utils/helpers.ts
│   ├── persistence/                 # Persistência
│   │   ├── persistence.service.ts
│   │   ├── persistence.controller.ts
│   │   ├── history-sync.service.ts
│   │   └── utils/message-parser.ts
│   └── audio/                       # Conversão de áudio
│       ├── audio.service.ts
│       └── audio.module.ts
│
├── integrations/                    # Integrações externas
│   ├── webhooks/                    # Sistema de webhooks
│   └── chatwoot/                    # Integração Chatwoot
│       ├── chatwoot.controller.ts
│       ├── chatwoot.service.ts
│       ├── chatwoot.client.ts
│       ├── chatwoot.repository.ts
│       ├── chatwoot-event.handler.ts
│       ├── handlers/
│       │   └── chatwoot-webhook.handler.ts
│       ├── services/
│       │   ├── chatwoot-config.service.ts
│       │   ├── chatwoot-contact.service.ts
│       │   ├── chatwoot-conversation.service.ts
│       │   ├── chatwoot-message.service.ts
│       │   ├── chatwoot-import.service.ts
│       │   └── chatwoot-bot.service.ts
│       └── libs/
│           └── chatwoot-postgres.client.ts
│
├── database/                        # Camada de dados
│   ├── database.service.ts          # Prisma client
│   └── repositories/
│       ├── session.repository.ts
│       ├── auth-state.repository.ts
│       ├── webhook.repository.ts
│       ├── contact.repository.ts
│       ├── chat.repository.ts
│       ├── message.repository.ts
│       ├── message-status-history.repository.ts
│       └── session-settings.repository.ts
│
├── logger/                          # Logging
│   ├── pino.logger.ts
│   ├── logger.service.ts
│   └── logger.config.ts
│
└── common/                          # Compartilhados
    ├── guards/api-key.guard.ts
    ├── decorators/public.decorator.ts
    ├── repositories/base.repository.ts
    ├── dto/
    ├── interfaces/
    │   ├── message-key.interface.ts
    │   └── last-message.interface.ts
    ├── utils/
    │   ├── socket-validator.ts
    │   ├── media-parser.ts
    │   ├── jid-formatter.ts
    │   └── extended-socket.type.ts
    └── constants/
        ├── presence.enum.ts
        └── privacy.enum.ts
```

---

## Endpoints da API

### Base URL: `http://localhost:3000`
### Autenticação: Header `apikey: your-api-key`
### Documentação Swagger: `http://localhost:3000/api/docs`

---

### Sessions (`/sessions`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/sessions/create` | Criar nova sessão |
| GET | `/sessions/list` | Listar todas as sessões |
| GET | `/sessions/:id/info` | Obter detalhes da sessão |
| DELETE | `/sessions/:id/delete` | Remover sessão |
| POST | `/sessions/:id/connect` | Conectar sessão |
| POST | `/sessions/:id/disconnect` | Desconectar sessão |
| POST | `/sessions/:id/logout` | Logout (remove credenciais) |
| GET | `/sessions/:id/qr` | Obter QR code |
| POST | `/sessions/:id/pair` | Parear com telefone |
| GET | `/sessions/:id/status` | Status da conexão |

**DTOs:**
- `CreateSessionDto`: `{ name: string }`
- `PairPhoneDto`: `{ phoneNumber: string }`

---

### Messages (`/sessions/:sessionId/messages`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/text` | Enviar texto |
| POST | `/image` | Enviar imagem |
| POST | `/video` | Enviar vídeo |
| POST | `/audio` | Enviar áudio/PTT |
| POST | `/document` | Enviar documento |
| POST | `/sticker` | Enviar sticker |
| POST | `/contact` | Enviar contato (vCard) |
| POST | `/location` | Enviar localização |
| POST | `/live-location` | Enviar localização ao vivo |
| POST | `/react` | Enviar reação |
| POST | `/forward` | Encaminhar mensagem |
| DELETE | `/delete` | Deletar mensagem |
| POST | `/edit` | Editar mensagem |
| POST | `/buttons` | Mensagem com botões |
| POST | `/template` | Mensagem template |
| POST | `/list` | Mensagem com lista |
| POST | `/poll` | Criar enquete |
| POST | `/interactive` | Mensagem interativa |
| POST | `/disappearing` | Config mensagens temporárias |

**Base DTO (SendMessageBaseDto):**
```typescript
{
  to: string;                    // Número destino
  quoted?: QuotedMessageDto;     // Mensagem citada
  ephemeralExpiration?: number;  // Tempo expiração
  statusJidList?: string[];      // JIDs para status
}
```

---

### Chats (`/sessions/:sessionId/chats`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Listar todos os chats |
| POST | `/:jid/archive` | Arquivar chat |
| POST | `/:jid/unarchive` | Desarquivar chat |
| POST | `/:jid/mute` | Silenciar chat |
| POST | `/:jid/unmute` | Dessilenciar chat |
| POST | `/:jid/pin` | Fixar chat |
| POST | `/:jid/unpin` | Desafixar chat |
| POST | `/:jid/mark-read` | Marcar como lido |
| POST | `/:jid/mark-unread` | Marcar como não lido |
| DELETE | `/:jid` | Deletar chat |
| POST | `/:jid/clear` | Limpar mensagens |
| POST | `/read-messages` | Marcar múltiplas como lidas |
| POST | `/:jid/star` | Favoritar/desfavoritar mensagem |
| POST | `/history` | Buscar histórico de mensagens |
| POST | `/receipt` | Enviar recibo de leitura |
| POST | `/receipts` | Enviar recibos em lote |
| POST | `/placeholder-resend` | Reenviar mensagens placeholder |

---

### Groups (`/sessions/:sessionId/groups`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Listar grupos |
| POST | `/` | Criar grupo |
| GET | `/:groupId` | Metadados do grupo |
| DELETE | `/:groupId` | Sair do grupo |
| POST | `/:groupId/participants` | Adicionar participantes |
| DELETE | `/:groupId/participants` | Remover participantes |
| POST | `/:groupId/participants/promote` | Promover a admin |
| POST | `/:groupId/participants/demote` | Rebaixar de admin |
| POST | `/:groupId/subject` | Atualizar nome |
| POST | `/:groupId/description` | Atualizar descrição |
| POST | `/:groupId/picture` | Atualizar foto |
| GET | `/:groupId/picture` | Obter foto |
| POST | `/:groupId/settings` | Atualizar configurações |
| GET | `/:groupId/invite` | Obter código convite |
| POST | `/:groupId/invite` | Revogar código convite |
| POST | `/invite` | Aceitar convite |
| GET | `/invite/:code` | Info do convite |
| POST | `/:groupId/ephemeral` | Ativar/desativar msg temporárias |
| GET | `/:groupId/join-requests` | Listar solicitações de entrada |
| POST | `/:groupId/join-requests` | Aprovar/rejeitar solicitações |
| POST | `/:groupId/member-add-mode` | Definir quem pode adicionar |
| POST | `/:groupId/join-approval-mode` | Definir modo de aprovação |
| POST | `/invite/v4` | Aceitar convite via mensagem |

---

### Contacts (`/sessions/:sessionId/contacts`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Listar contatos |
| POST | `/` | Adicionar/editar contato |
| DELETE | `/:jid` | Remover contato |
| POST | `/validate` | Validar números no WhatsApp |
| GET | `/business/:jid` | Perfil de negócio |
| GET | `/:jid/disappearing` | Duração de msg temporárias |

---

### Profile (`/sessions/:sessionId/profile`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Obter perfil próprio |
| GET | `/status/:jid` | Status de um contato |
| PUT | `/status` | Atualizar status |
| PUT | `/name` | Atualizar nome |
| GET | `/picture/:jid` | Obter foto de perfil |
| PUT | `/picture` | Atualizar foto |
| PUT | `/picture/remove` | Remover foto |
| POST | `/block` | Bloquear usuário |
| POST | `/unblock` | Desbloquear usuário |
| GET | `/blocklist` | Lista de bloqueados |

---

### Presence (`/sessions/:sessionId/presence`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/update` | Atualizar presença (online/typing) |
| POST | `/subscribe` | Inscrever em atualizações |
| GET | `/cache` | Obter cache de presenças |

**Tipos de Presença:**
```typescript
enum WAPresence {
  UNAVAILABLE = 'unavailable',
  AVAILABLE = 'available',
  COMPOSING = 'composing',
  RECORDING = 'recording',
  PAUSED = 'paused',
}
```

---

### Media (`/sessions/:sessionId/media`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/download` | Download de mídia |
| POST | `/update` | Re-upload de mídia |
| POST | `/upload` | Upload direto para servidor |

---

### Settings (`/sessions/:sessionId/settings`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/` | Atualizar configurações |
| GET | `/` | Obter configurações |
| GET | `/privacy` | Obter privacidade do WhatsApp |

```typescript
interface SessionSettings {
  rejectCall: boolean;
  groupsIgnore: boolean;
  alwaysOnline: boolean;
  readMessages: boolean;
  readStatus: boolean;
  syncFullHistory: boolean;
  profilePicture: WAPrivacyValue;
  status: WAPrivacyValue;
  lastSeen: WAPrivacyValue;
  online: WAPrivacyOnlineValue;
  call: WAPrivacyCallValue;
  messages: WAPrivacyMessagesValue;
  readReceipts: WAReadReceiptsValue;
  groupsAdd: WAPrivacyGroupAddValue;
}
```

---

### Calls (`/sessions/:sessionId/calls`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/link` | Criar link de chamada |
| POST | `/reject` | Rejeitar chamada recebida |

---

### Newsletters (`/sessions/:sessionId/newsletters`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/` | Criar canal/newsletter |
| GET | `/:jid` | Obter metadados do canal |
| POST | `/:jid/follow` | Seguir canal |
| POST | `/:jid/unfollow` | Deixar de seguir |
| POST | `/:jid/mute` | Silenciar canal |
| POST | `/:jid/unmute` | Dessilenciar canal |
| PUT | `/:jid/name` | Atualizar nome |
| PUT | `/:jid/description` | Atualizar descrição |
| PUT | `/:jid/picture` | Atualizar foto |
| DELETE | `/:jid/picture` | Remover foto |
| POST | `/:jid/react` | Reagir a mensagem |
| GET | `/:jid/messages` | Buscar mensagens |
| DELETE | `/:jid` | Deletar canal |
| GET | `/:jid/admin-count` | Contagem de admins |
| GET | `/:jid/subscribers` | Lista de inscritos |

---

### Labels (`/sessions/:sessionId/labels`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/` | Criar label |
| POST | `/chat` | Adicionar label a chat |
| DELETE | `/chat` | Remover label de chat |
| POST | `/message` | Adicionar label a mensagem |
| DELETE | `/message` | Remover label de mensagem |

---

### Communities (`/sessions/:sessionId/communities`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/` | Criar comunidade |
| GET | `/:jid` | Obter metadados |
| DELETE | `/:jid` | Sair da comunidade |
| POST | `/:jid/groups` | Criar grupo na comunidade |
| GET | `/:jid/groups` | Listar grupos vinculados |
| POST | `/:jid/groups/link` | Vincular grupos |
| POST | `/:jid/groups/unlink` | Desvincular grupos |
| PUT | `/:jid/subject` | Atualizar nome |
| PUT | `/:jid/description` | Atualizar descrição |
| GET | `/:jid/invite` | Obter código convite |
| POST | `/invite/accept` | Aceitar convite |
| POST | `/:jid/invite/revoke` | Revogar convite |
| POST | `/:jid/participants` | Atualizar participantes |

---

### Business (`/sessions/:sessionId/business`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/catalog` | Obter catálogo de produtos |
| GET | `/collections` | Obter coleções |
| GET | `/orders/:orderId` | Detalhes de pedido |
| GET | `/profile/:jid` | Perfil de negócio |
| POST | `/products` | Criar produto |
| PUT | `/products/:productId` | Atualizar produto |
| DELETE | `/products` | Deletar produtos |

---

### Persistence (`/sessions/:sessionId`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/chats` | Listar chats persistidos |
| GET | `/chats/:chatId` | Detalhes do chat |
| GET | `/chats/:chatId/messages` | Mensagens do chat |
| GET | `/contacts` | Listar contatos persistidos |

---

### Webhooks (`/sessions`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/:sessionId/webhook/set` | Configurar webhook |
| GET | `/:sessionId/webhook/find` | Buscar configuração |
| GET | `/webhook/events` | Listar eventos disponíveis |
| POST | `/:sessionId/webhook/test` | Testar webhook |

---

### Chatwoot (`/sessions/:sessionId/chatwoot`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/set` | Configurar integração |
| GET | `/find` | Buscar configuração |
| DELETE | `/` | Remover configuração |
| GET | `/import/status` | Status do import PostgreSQL |
| POST | `/sync` | Sincronizar mensagens perdidas |
| POST | `/import/contacts` | Importar contatos |
| POST | `/import/messages` | Importar mensagens |

**Endpoints públicos:**
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/chatwoot/webhook/:sessionId` | Webhook do Chatwoot |
| POST | `/chatwoot/receive/:sessionId` | Receber eventos zpwoot |

---

## Módulos Core

### WhatsAppService
```typescript
// src/core/whatsapp/whatsapp.service.ts
@Injectable()
export class WhatsAppService {
  async createSocket(sessionId: string): Promise<{ socket: WASocket; qr?: string }>
  getSocket(sessionId: string): WASocket | undefined
  getQRCode(sessionId: string): string | undefined
  async disconnectSocket(sessionId: string): Promise<void>
  async reconnectActiveSessions(): Promise<void>
}
```

### Event Handlers

| Handler | Eventos |
|---------|---------|
| `ConnectionHandler` | `connection.update`, `creds.update` |
| `MessagesHandler` | `messages.upsert`, `messages.update`, `messages.delete`, `message-receipt.update` |
| `ChatsHandler` | `chats.upsert`, `chats.update`, `chats.delete` |
| `HistoryHandler` | `messaging-history.set` |
| `ContactsHandler` | `contacts.upsert`, `contacts.update` |
| `PresenceHandler` | `presence.update` |
| `GroupsPersistenceHandler` | `groups.upsert`, `groups.update` |
| `GroupsExtendedHandler` | `group-participants.update`, `group.join-request` |
| `CallsHandler` | `call` |
| `LabelsHandler` | `labels.edit`, `labels.association` |
| `NewsletterHandler` | `newsletter.*` |
| `BlocklistHandler` | `blocklist.set`, `blocklist.update` |
| `MiscHandler` | Outros eventos diversos |

### PersistenceService
```typescript
// src/core/persistence/persistence.service.ts
@Injectable()
export class PersistenceService {
  // Contatos
  async createOrUpdateContact(sessionId, contactData)
  async createContactsBatch(sessionId, contacts)
  async getContacts(sessionId, filters)
  
  // Chats
  async createOrUpdateChat(sessionId, chatData)
  async createChatsBatch(sessionId, chats)
  async getChats(sessionId, filters)
  async getChat(sessionId, chatId)
  
  // Mensagens
  async createMessage(sessionId, messageData)
  async createMessagesBatch(sessionId, messages)
  async getMessages(chatId, filters)
  async updateMessageStatus(sessionId, messageId, status)
  async markMessageAsDeleted(sessionId, messageId)
  
  // Chatwoot tracking
  async updateMessageChatwoot(sessionId, messageId, chatwootData)
  async findMessageByChatwootId(sessionId, chatwootMessageId)
  async findMessageByWAId(sessionId, waMessageId)
}
```

### AudioService
```typescript
// src/core/audio/audio.service.ts
@Injectable()
export class AudioService {
  async convertToOpus(inputPath: string): Promise<Buffer>
  async convertToPTT(inputPath: string): Promise<Buffer>
}
```

---

## Integrações

### Sistema de Webhooks

#### 35 Eventos Disponíveis
```typescript
const VALID_WEBHOOK_EVENTS = [
  // Conexão
  'connection.update', 'creds.update',
  
  // Histórico
  'messaging-history.set',
  
  // Chats
  'chats.upsert', 'chats.update', 'chats.delete',
  
  // Presença
  'presence.update',
  
  // Contatos
  'contacts.upsert', 'contacts.update', 'contacts.phone-number-share',
  
  // Mensagens
  'messages.pdo-response', 'messages.delete', 'messages.update',
  'messages.media-update', 'messages.upsert', 'messages.reaction',
  'message-receipt.update',
  
  // Grupos
  'groups.upsert', 'groups.update', 'group-participants.update',
  'group.join-request',
  
  // Bloqueio
  'blocklist.set', 'blocklist.update',
  
  // Chamadas
  'call',
  
  // Labels (WhatsApp Business)
  'labels.edit', 'labels.association',
  
  // LID Mapping
  'lid-mapping.update',
  
  // Newsletter (Canais)
  'newsletter.reaction', 'newsletter.view',
  'newsletter-participants.update', 'newsletter-settings.update',
];
```

#### Payload
```json
{
  "sessionId": "uuid",
  "event": "messages.upsert",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "data": { }
}
```

### Integração Chatwoot

#### Configuração
```typescript
{
  sessionId: string;
  enabled: boolean;
  accountId: string;
  token: string;
  url: string;
  inbox: string;
  signMsg: boolean;           // Assinar msgs em grupos
  signDelimiter: string;
  reopenConversation: boolean;
  pending: boolean;
  mergeBrazil: boolean;
  importContacts: boolean;
  importMessages: boolean;
  importDays: number;
  organization: string;
  logo: string;
  ignoreJids: string[];
  postgresUrl: string;        // Conexão direta PostgreSQL
}
```

#### Fluxo WhatsApp → Chatwoot
1. `messages.upsert` recebido
2. `MessagesHandler.forwardToChatwoot()` processa
3. Busca/cria contato no Chatwoot
4. Busca/cria conversa
5. Cria mensagem com `sourceId`
6. Atualiza tracking: `cwConversationId`, `cwMessageId`

#### Fluxo Chatwoot → WhatsApp
1. Webhook em `/chatwoot/webhook/:sessionId`
2. Valida evento `message_created`, `outgoing`, `sender.type=user`
3. Ignora se tem `source_id` (evita loop)
4. Extrai `identifier` do contato
5. Valida número com `onWhatsApp()` (suporte a LID)
6. Envia mensagem via `MessagesService`

#### Import PostgreSQL
Com `postgresUrl` configurado, é possível:
- Sincronizar mensagens perdidas (`/sync`)
- Importar contatos em lote (`/import/contacts`)
- Importar histórico de mensagens (`/import/messages`)

---

## Banco de Dados

### Schema Principal

#### Session
```prisma
model Session {
  id        String           @id @default(uuid())
  name      String
  status    SessionStatus    @default(disconnected)
  qrCode    String?
  phone     String?
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
  
  authState   AuthState[]
  webhook     Webhook?
  contacts    Contact[]
  chats       Chat[]
  messages    Message[]
  settings    SessionSettings?
  chatwoot    Chatwoot?
  proxy       Proxy?
  groups      Group[]
  calls       Call[]
}

enum SessionStatus { disconnected, connecting, connected }
```

#### Message
```prisma
model Message {
  id          String        @id @default(uuid())
  sessionId   String
  chatId      String
  remoteJid   String
  messageId   String
  fromMe      Boolean
  senderJid   String?
  sender      String?
  timestamp   BigInt
  messageType String
  
  textContent String?
  mediaUrl    String?
  fileLength  BigInt?
  content     Json
  
  // Chatwoot tracking
  cwConversationId Int?
  cwMessageId      Int?
  cwInboxId        Int?
  cwContactId      Int?
  
  // WhatsApp message key
  waMessageKey Json?
  waMessage    Json?
  
  status    MessageStatus @default(pending)
  deleted   Boolean       @default(false)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  
  statusHistory MessageStatusHistory[]
  reactions     MessageReaction[]
  
  @@unique([sessionId, messageId])
  @@index([sessionId, chatId, timestamp])
  @@index([cwConversationId])
  @@index([cwMessageId])
}

enum MessageStatus { pending, sent, delivered, read, failed }
```

#### Group
```prisma
model Group {
  id            String   @id @default(uuid())
  sessionId     String
  groupJid      String
  subject       String?
  owner         String?
  description   String?
  participants  Json?
  creation      BigInt?
  restrict      Boolean  @default(false)
  announce      Boolean  @default(false)
  size          Int?
  ephemeral     Int?
  inviteCode    String?
  
  @@unique([sessionId, groupJid])
}
```

#### Call
```prisma
model Call {
  id          String     @id @default(uuid())
  sessionId   String
  callId      String
  fromJid     String
  toJid       String?
  status      CallStatus @default(ringing)
  isVideo     Boolean    @default(false)
  isGroup     Boolean    @default(false)
  timestamp   BigInt
  
  @@unique([sessionId, callId])
}

enum CallStatus { ringing, accepted, rejected, missed, timeout }
```

#### Proxy
```prisma
model Proxy {
  id        String   @id @default(cuid())
  sessionId String   @unique
  enabled   Boolean  @default(false)
  host      String?
  port      Int?
  protocol  String?  @default("http") // http, https, socks4, socks5
  username  String?
  password  String?
}
```

#### Chatwoot
```prisma
model Chatwoot {
  id              String   @id @default(cuid())
  sessionId       String   @unique
  enabled         Boolean  @default(false)
  accountId       String?
  token           String?
  url             String?
  inbox           String?
  signMsg         Boolean  @default(false)
  signDelimiter   String?  @default("\\n")
  reopen          Boolean  @default(false)
  pending         Boolean  @default(false)
  mergeBrazil     Boolean  @default(false)
  importContacts  Boolean  @default(false)
  importMessages  Boolean  @default(false)
  importDays      Int?     @default(3)
  organization    String?
  logo            String?
  ignoreJids      String[] @default([])
  postgresUrl     String?
}
```

#### MessageReaction
```prisma
model MessageReaction {
  id          String   @id @default(uuid())
  messageId   String
  senderJid   String
  reaction    String
  timestamp   BigInt
  
  @@unique([messageId, senderJid])
}
```

#### Enums de Privacidade
```prisma
enum WAPrivacyValue { all, contacts, contact_blacklist, none }
enum WAPrivacyOnlineValue { all, match_last_seen }
enum WAPrivacyCallValue { all, known }
enum WAPrivacyMessagesValue { all, contacts }
enum WAReadReceiptsValue { all, none }
enum WAPrivacyGroupAddValue { all, contacts, contact_blacklist }
```

---

## Sistema de Eventos e Webhooks

### Arquitetura
```
WhatsApp Server
      │
      ▼
┌─────────────────┐
│  Whaileys SDK   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│         Event Handlers          │
├─────────────────────────────────┤
│ ConnectionHandler               │
│ MessagesHandler → Chatwoot      │
│ ChatsHandler                    │
│ HistoryHandler                  │
│ ContactsHandler                 │
│ PresenceHandler                 │
│ GroupsPersistenceHandler        │
│ CallsHandler                    │
│ LabelsHandler                   │
│ NewsletterHandler               │
│ BlocklistHandler                │
└────────┬─────────────┬──────────┘
         │             │
         ▼             ▼
┌────────────────┐  ┌─────────────┐
│ Persistence    │  │ Webhooks    │
│ Service        │  │ Service     │
└────────────────┘  └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              URL Config 1   Chatwoot
```

---

## Fluxos de Trabalho Essenciais

### 1. Criar e Conectar Sessão
```bash
# Criar
POST /sessions/create
Body: { "name": "Minha Sessão" }

# Conectar
POST /sessions/:id/connect

# Obter QR
GET /sessions/:id/qr

# Verificar status
GET /sessions/:id/status
```

### 2. Enviar Mensagem
```bash
POST /sessions/:sessionId/messages/text
Headers: { "apikey": "your-api-key" }
Body: {
  "to": "5511999999999",
  "text": "Olá!"
}
```

### 3. Configurar Webhook
```bash
POST /sessions/:sessionId/webhook/set
Body: {
  "url": "https://meu-webhook.com/events",
  "events": ["messages.upsert", "connection.update"]
}
```

### 4. Configurar Chatwoot
```bash
POST /sessions/:sessionId/chatwoot/set
Body: {
  "enabled": true,
  "accountId": "1",
  "token": "chatwoot-token",
  "url": "https://chatwoot.example.com",
  "inbox": "WhatsApp",
  "reopenConversation": true
}
```

---

## Padrões e Convenções

### DTOs com Validação
```typescript
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendTextMessageDto extends SendMessageBaseDto {
  @ApiProperty({ description: 'Texto da mensagem' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];
}
```

### Guards e Decorators
```typescript
@UseGuards(ApiKeyGuard)
@Controller('sessions')
export class SessionsController {}

@Public()  // Endpoint público
@Post('webhook/:sessionId')
async handleWebhook() {}
```

### Injeção de Dependências
```typescript
constructor(
  private readonly service: MyService,
  @Inject(forwardRef(() => CircularService))
  private readonly circularService: CircularService,
) {}
```

### Tratamento de Erros
```typescript
import * as Boom from '@hapi/boom';

throw Boom.notFound('Session not found');
throw new NotFoundException(`Session ${id} not found`);
throw new BadRequestException('Invalid parameters');
```

---

## Logging

### PinoLoggerService
```typescript
// Uso
private readonly logger = new Logger(MyService.name);

this.logger.log(`Message sent`, { sessionId, messageId });
this.logger.error(`Failed`, error.stack);
this.logger.debug(`Processing`, { data });
```

### Variáveis
```env
LOG_LEVEL=info    # trace, debug, info, warn, error
LOG_FORMAT=pretty # pretty (dev), json (prod)
```

---

## Troubleshooting

### Sessão não conecta
```bash
LOG_LEVEL=debug npm run start:dev
# Verificar AuthState no banco
DELETE FROM "AuthState" WHERE "sessionId" = 'uuid';
```

### Mensagens não enviadas
- Verificar status: `GET /sessions/:id/status` → `connected`
- Formato número: `5511999999999` (sem + ou espaços)

### Webhook não dispara
```bash
GET /sessions/:sessionId/webhook/find
POST /sessions/:sessionId/webhook/test
```

### Chatwoot não recebe mensagens
- Verificar `enabled: true`
- Inbox criado corretamente
- webhookUrl: `http://servidor/chatwoot/webhook/:sessionId`

### Database Queries Úteis
```sql
-- Sessões conectadas
SELECT id, name, status FROM "Session" WHERE status = 'connected';

-- Mensagens recentes
SELECT "messageId", "messageType", "textContent"
FROM "Message"
WHERE "sessionId" = 'uuid'
ORDER BY timestamp DESC LIMIT 10;

-- Tracking Chatwoot
SELECT "messageId", "cwConversationId", "cwMessageId"
FROM "Message"
WHERE "cwMessageId" IS NOT NULL;

-- Grupos da sessão
SELECT "groupJid", subject, size
FROM "Group"
WHERE "sessionId" = 'uuid';

-- Chamadas recebidas
SELECT "callId", "fromJid", status, "isVideo"
FROM "Call"
WHERE "sessionId" = 'uuid'
ORDER BY timestamp DESC;
```

---

## Contribuição

### Adicionar Nova Feature
1. `nest generate module api/new-feature`
2. Criar DTOs com class-validator
3. Implementar Service
4. Criar Controller com Swagger decorators
5. Adicionar ao AppModule
6. Atualizar AGENTS.md

### Checklist
- [ ] DTO com validação
- [ ] Documentação Swagger
- [ ] Logging adequado
- [ ] Tratamento de erros
- [ ] Testes
- [ ] AGENTS.md atualizado

---

## Recursos

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Whaileys (Baileys)](https://github.com/WhiskeySockets/Baileys)
- [Chatwoot API](https://www.chatwoot.com/developers/api/)
- [Pino Logger](https://getpino.io)
