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
  "@hapi/boom": "^10.0.1"
}
```

### Principais Características
- Multi-sessões WhatsApp independentes
- 23 eventos de webhook suportados
- Integração bidirecional com Chatwoot
- Persistência completa de mensagens, contatos e chats
- Sincronização de histórico WhatsApp
- Suporte a 18+ tipos de mensagens
- Rastreamento de mensagens Chatwoot ↔ WhatsApp
- Reconexão automática de sessões
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
│   └── settings/                    # Configurações
│
├── core/                            # Lógica principal
│   ├── whatsapp/                    # Integração Whaileys
│   │   ├── whatsapp.service.ts
│   │   ├── auth-state.ts
│   │   ├── managers/socket.manager.ts
│   │   ├── handlers/
│   │   │   ├── connection.handler.ts
│   │   │   ├── messages.handler.ts
│   │   │   ├── chats.handler.ts
│   │   │   └── history.handler.ts
│   │   └── utils/helpers.ts
│   └── persistence/                 # Persistência
│       ├── persistence.service.ts
│       ├── persistence.controller.ts
│       ├── history-sync.service.ts
│       └── utils/message-parser.ts
│
├── integrations/                    # Integrações externas
│   ├── webhooks/                    # Sistema de webhooks
│   └── chatwoot/                    # Integração Chatwoot
│
├── database/                        # Camada de dados
│   ├── database.service.ts          # Prisma client
│   └── repositories/                # Repositories
│
├── logger/                          # Logging
│   ├── pino.logger.ts
│   └── logger.service.ts
│
└── common/                          # Compartilhados
    ├── guards/api-key.guard.ts
    ├── decorators/public.decorator.ts
    ├── dto/
    ├── interfaces/
    └── constants/
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

**Exemplo SendTextMessageDto:**
```typescript
{
  to: "5511999999999",
  text: "Olá!",
  mentions?: ["5511888888888@s.whatsapp.net"]
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

---

### Contacts (`/sessions/:sessionId/contacts`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Listar contatos |
| POST | `/validate` | Validar números no WhatsApp |
| GET | `/business/:jid` | Perfil de negócio |

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

---

### Media (`/sessions/:sessionId/media`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/download` | Download de mídia |
| POST | `/update` | Re-upload de mídia |

---

### Settings (`/sessions/:sessionId/settings`)

Configurações de privacidade e comportamento da sessão.

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
  groupsAdd: WAPrivacyGroupAddValue;
}
```

---

### Persistence (`/sessions/:sessionId`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/chats` | Listar chats persistidos |
| GET | `/chats/:chatId` | Detalhes do chat |
| GET | `/chats/:chatId/messages` | Mensagens do chat |
| GET | `/contacts` | Listar contatos persistidos |

---

### Webhooks

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/session/:sessionId/webhook/set` | Configurar webhook |
| GET | `/session/:sessionId/webhook/find` | Buscar configuração |
| GET | `/webhook/events` | Listar eventos disponíveis |
| POST | `/session/:sessionId/webhook/test` | Testar webhook |

---

### Chatwoot

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/session/:sessionId/chatwoot/set` | Configurar integração |
| GET | `/session/:sessionId/chatwoot/find` | Buscar configuração |
| DELETE | `/session/:sessionId/chatwoot` | Remover configuração |
| POST | `/chatwoot/webhook/:sessionId` | Webhook Chatwoot (público) |
| POST | `/chatwoot/receive/:sessionId` | Receber eventos zpwoot (público) |

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

---

## Integrações

### Sistema de Webhooks

#### 23 Eventos Disponíveis
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
  
  // Bloqueio
  'blocklist.set', 'blocklist.update',
  
  // Chamadas
  'call',
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
  nameInbox: string;
  signMsg: boolean;           // Assinar msgs em grupos
  signDelimiter: string;
  reopenConversation: boolean;
  conversationPending: boolean;
  mergeBrazilContacts: boolean;
  importContacts: boolean;
  importMessages: boolean;
  daysLimitImportMessages: number;
  ignoreJids: string[];
}
```

#### Fluxo WhatsApp → Chatwoot
1. `messages.upsert` recebido
2. `MessagesHandler.forwardToChatwoot()` processa
3. Busca/cria contato no Chatwoot
4. Busca/cria conversa
5. Cria mensagem com `sourceId`
6. Atualiza tracking: `chatwootConversationId`, `chatwootMessageId`

#### Fluxo Chatwoot → WhatsApp
1. Webhook em `/chatwoot/webhook/:sessionId`
2. Valida evento `message_created`, `outgoing`, `sender.type=user`
3. Ignora se tem `source_id` (evita loop)
4. Extrai `identifier` do contato
5. Valida número com `onWhatsApp()` (suporte a LID)
6. Envia mensagem via `MessagesService`

#### Suporte a Reply
O Chatwoot envia `content_attributes.in_reply_to` ou `in_reply_to_external_id`. O sistema busca a mensagem original via `waMessageKey` para enviar como quoted.

---

## Banco de Dados

### Schema Principal

#### Session
```prisma
model Session {
  id          String           @id @default(uuid())
  name        String
  status      SessionStatus    @default(disconnected)
  qrCode      String?
  phoneNumber String?
  
  authState   AuthState[]
  webhooks    Webhook[]
  contacts    Contact[]
  chats       Chat[]
  messages    Message[]
  settings    SessionSettings?
  chatwoot    Chatwoot?
}

enum SessionStatus { disconnected, connecting, connected }
```

#### Message
```prisma
model Message {
  id            String        @id @default(uuid())
  sessionId     String
  chatId        String
  remoteJid     String
  messageId     String
  fromMe        Boolean
  senderJid     String?
  senderName    String?
  timestamp     BigInt
  messageType   String
  
  // Campos otimizados
  textContent   String?
  mediaUrl      String?
  fileLength    BigInt?
  content       Json
  
  // Chatwoot tracking
  chatwootConversationId  Int?
  chatwootMessageId       Int?
  chatwootInboxId         Int?
  chatwootContactId       Int?
  
  // WhatsApp message key (reply/edit/delete)
  waMessageKey  Json?
  
  status        MessageStatus @default(pending)
  isDeleted     Boolean       @default(false)
  
  @@unique([sessionId, messageId])
  @@index([sessionId, chatId, timestamp])
  @@index([chatwootConversationId])
  @@index([chatwootMessageId])
}

enum MessageStatus { pending, sent, delivered, read, failed }
```

#### Chatwoot
```prisma
model Chatwoot {
  id                      String   @id @default(cuid())
  sessionId               String   @unique
  enabled                 Boolean  @default(false)
  accountId               String?
  token                   String?
  url                     String?
  nameInbox               String?
  signMsg                 Boolean  @default(false)
  signDelimiter           String?  @default("\\n")
  reopenConversation      Boolean  @default(false)
  conversationPending     Boolean  @default(false)
  mergeBrazilContacts     Boolean  @default(false)
  importContacts          Boolean  @default(false)
  importMessages          Boolean  @default(false)
  daysLimitImportMessages Int?     @default(3)
  ignoreJids              String[] @default([])
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
POST /session/:sessionId/webhook/set
Body: {
  "url": "https://meu-webhook.com/events",
  "events": ["messages.upsert", "connection.update"]
}
```

### 4. Configurar Chatwoot
```bash
POST /session/:sessionId/chatwoot/set
Body: {
  "enabled": true,
  "accountId": "1",
  "token": "chatwoot-token",
  "url": "https://chatwoot.example.com",
  "nameInbox": "WhatsApp"
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
GET /session/:sessionId/webhook/find
POST /session/:sessionId/webhook/test
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
SELECT "messageId", "chatwootConversationId", "chatwootMessageId"
FROM "Message"
WHERE "chatwootMessageId" IS NOT NULL;
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
