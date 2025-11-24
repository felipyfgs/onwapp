# AGENTS.md

## Guia para Agentes de IA - Zpwoot WhatsApp API

Este projeto é uma API robusta para gerenciamento de sessões WhatsApp construída com NestJS (TypeScript), PostgreSQL e integração com Whaileys. Siga estas diretrizes para máxima produtividade e desenvolvimento eficiente.

---

## Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Setup de Desenvolvimento](#setup-de-desenvolvimento)
3. [Estrutura de Módulos](#estrutura-de-módulos)
4. [Serviços Core](#serviços-core)
5. [Banco de Dados](#banco-de-dados)
6. [Fluxos de Trabalho Essenciais](#fluxos-de-trabalho-essenciais)
7. [Padrões e Convenções](#padrões-e-convenções)
8. [Exemplos Práticos](#exemplos-práticos)
9. [API Documentation](#api-documentation)
10. [Troubleshooting](#troubleshooting)

---

## Visão Geral da Arquitetura

### Stack Tecnológico
- **Backend**: NestJS 11+ (TypeScript)
- **Banco de Dados**: PostgreSQL 16 com Prisma ORM
- **WhatsApp Integration**: Whaileys
- **Logging**: Pino com estrutura centralizada
- **API Documentation**: Swagger/OpenAPI 3.0
- **Container**: Docker + Docker Compose

### Principais Características
- Multi-sessões WhatsApp independentes
- Sistema de webhooks configurável
- Persistência completa de mensagens e contatos
- Suporte a todos os tipos de mensagens WhatsApp
- Interface administrativa via API RESTful

---

## Setup de Desenvolvimento

### 1. Ambiente Docker (Recomendado)
```bash
# Iniciar banco de dados e interface de administração
docker-compose up -d

# Verificar status dos containers
docker-compose ps
```

Acesso aos serviços:
- PostgreSQL: `localhost:5432`
- DBGate (Database Admin): `http://localhost:3001`

### 2. Instalação e Execução
```bash
# Instalar dependências
npm install

# Variáveis de ambiente necessárias (criar .env)
DATABASE_URL="postgresql://zpwoot:zpwoot123@localhost:5432/zpwoot"
PORT=3000

# Rodar migrations do Prisma
npx prisma migrate dev

# Iniciar servidor de desenvolvimento
npm run start:dev

# Build de produção
npm run build
npm run start:prod
```

### 3. Scripts Úteis
```bash
# Testes
npm run test              # Unit tests
npm run test:e2e         # End-to-end tests
npm run test:cov         # Test coverage

# Código
npm run lint             # ESLint
npm run format           # Prettier

# Prisma
npx prisma studio        # Database GUI
npx prisma generate      # Generate client
```

---

## Estrutura de Módulos

### Módulos Principais

#### `sessions/` - Gestão de Sessões WhatsApp
- **Controller**: Criação, listagem, remoção de sessões
- **Service**: Gerenciamento de conexões, QR codes, status
- **DTOs**: `CreateSessionDto`, `PairPhoneDto`, `SessionResponseDto`

#### `messages/` - Envio e Gestão de Mensagens
- **Controller**: Envio de todos os tipos de mensagens
- **Service**: Processamento, validação, envio via Whaileys
- **DTOs**: Múltiplos DTOs para cada tipo de mensagem (texto, imagem, áudio, etc.)

#### `chats/` - Gestão de Conversas
- **Controller**: Arquivar, limpar, marcar lidas, mutar
- **Service**: Operações bulk em conversas
- **DTOs**: `ArchiveChatDto`, `ClearMessagesDto`, `MarkReadDto`

#### `contacts/` - Gestão de Contatos
- **Controller**: Validação de números, perfil de negócio
- **Service**: Sincronização e gerenciamento de contatos
- **DTOs**: `ValidateNumberDto`, `BusinessProfileResponseDto`

#### `groups/` - Gestão de Grupos
- **Controller**: Criação, administração de participantes
- **Service**: Metadados, configurações, convites
- **DTOs**: `CreateGroupDto`, `ManageParticipantsDto`, `UpdateGroupSettingsDto`

#### `media/` - Gestão de Mídia
- **Controller**: Download e upload de arquivos
- **Service**: Processamento e armazenamento de mídia
- **DTOs**: `DownloadMediaDto`, `UpdateMediaDto`

#### `presence/` - Gestão de Presença
- **Controller**: Status online, presença de contatos
- **Service**: Cache e sincronização de presença
- **DTOs**: `UpdatePresenceDto`, `SubscribePresenceDto`

#### `profile/` - Gestão de Perfil
- **Controller**: Nome, foto, status, bloqueios
- **Service**: Configurações do perfil da sessão
- **DTOs**: `UpdateProfileNameDto`, `UpdateProfilePictureDto`

#### `webhooks/` - Sistema de Webhooks
- **Controller**: Configuração de endpoints webhook
- **Service**: Disparo de eventos para URLs configuradas
- **DTOs**: `SetWebhookDto`, `WebhookResponseDto`

#### `persistence/` - Persistência de Dados
- **Controller**: Recuperação histórica de dados
- **Service**: Sincronização e parseamento de mensagens
- **DTOs**: `GetChatsDto`, `GetContactsDto`, `GetMessagesDto`

#### `settings/` - Configurações da Sessão
- **Controller**: Configurações de privacidade e comportamento
- **Service**: Gestão de preferências da sessão
- **DTOs**: `UpdateSettingsDto`, `SettingsResponseDto`

---

## Serviços Core

### DatabaseService
```typescript
// Localização: src/database/database.service.ts
// Extende PrismaClient com PostgreSQL adapter
@Injectable()
export class DatabaseService extends PrismaClient {
  constructor(private configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }
}
```

### PinoLoggerService
```typescript
// Localização: src/logger/logger.service.ts
// Logging estruturado com Pino
@Injectable()
export class PinoLoggerService implements LoggerService {
  // Implementação com níveis de log customizados
}
```

### WhatsAppService
```typescript
// Localização: src/whatsapp/whatsapp.service.ts
// Core service para integração com Whaileys
@Injectable()
export class WhatsAppService {
  // Gerenciamento de conexões, eventos, reconexão automática
  async reconnectActiveSessions(): Promise<void>
}
```

---

## Banco de Dados

### Modelo de Entidades Principais

#### Session
```prisma
model Session {
  id          String           @id @default(uuid())
  name        String
  status      SessionStatus    @default(disconnected)
  qrCode      String?
  phoneNumber String?
  // Relacionamentos com todas as outras entidades
}
```

#### Message
```prisma
model Message {
  id            String        @id @default(uuid())
  sessionId     String
  chatId        String
  messageId     String
  messageType   String
  content       Json          // Conteúdo estruturado
  status        MessageStatus @default(pending)
  // Timestamps e metadados
}
```

#### Enums de Privacidade WhatsApp
- `WAPrivacyValue`: `all | contacts | contact_blacklist | none`
- `WAPrivacyOnlineValue`: `all | match_last_seen`
- `WAPrivacyCallValue`: `all | known`
- Configurações detalhadas em `SessionSettings`

---

## Fluxos de Trabalho Essenciais

### 1. Criação de Nova Sessão
```typescript
// POST /sessions
// Body: { "name": "Minha Sessão" }
// Response: SessionResponseDto com QR code para pairing
```

### 2. Envio de Mensagem de Texto
```typescript
// POST /messages/text
// Body: {
//   "sessionId": "uuid",
//   "remoteJid": "5511999998888@s.whatsapp.net",
//   "text": "Olá mundo!"
// }
```

### 3. Configuração de Webhook
```typescript
// POST /webhooks
// Body: {
//   "sessionId": "uuid",
//   "url": "https://meu-webhook.com/events",
//   "events": ["messages.upsert", "connection.update"]
// }
```

### 4. Recuperação de Histórico
```typescript
// GET /persistence/messages?sessionId=uuid&limit=50&offset=0
// Response: Lista paginada de mensagens persistidas
```

---

## Padrões e Convenções

### Injeção de Dependências
```typescript
constructor(
  private readonly sessionsService: SessionsService,
  private readonly databaseService: DatabaseService,
  private readonly logger: PinoLoggerService,
) {}
```

### DTOs e Validação
```typescript
@Body() createSessionDto: CreateSessionDto
// Todos os DTOs usam class-validator e class-transformer
// Validação global via ValidationPipe com whitelist: true
```

### Autenticação
```typescript
@UseGuards(ApiKeyGuard)  // API Key via header 'apikey'
@Public()                 // Endpoints públicos (ex: QR code generation)
```

### Repositories Pattern
```typescript
// Localização: src/database/repositories/
// BaseRepository com métodos CRUD padrão
// Repositories específicos por entidade (SessionRepository, MessageRepository...)
```

### Tratamento de Erros
```typescript
// Usar @hapi/Boom para erros HTTP
throw Boom.notFound('Session not found');
throw Boom.badRequest('Invalid phone number');
```

### Logging
```typescript
// Usar logger injetado com contexto
this.logger.log(`Session ${sessionId} connected`, 'SessionsService');
this.logger.error(`Failed to send message`, error, 'MessagesService');
```

---

## Exemplos Práticos

### Controller Completo
```typescript
@Controller('sessions')
@UseGuards(ApiKeyGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  async create(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionsService.create(createSessionDto);
  }

  @Get(':id/qrcode')
  @Public()  // Endpoint público para QR code
  async getQrCode(@Param('id') id: string) {
    return this.sessionsService.getQrCode(id);
  }
}
```

### Service com Repository
```typescript
@Injectable()
export class MessagesService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly whatsappService: WhatsAppService,
  ) {}

  async sendTextMessage(dto: SendTextMessageDto) {
    const session = await this.whatsappService.getSession(dto.sessionId);
    const result = await session.sendMessage(dto.remoteJid, {
      text: dto.text,
    });
    
    await this.messageRepository.create({
      ...dto,
      messageId: result.key.id,
      status: MessageStatus.SENT,
    });
    
    return result;
  }
```

### DTO Complexo
```typescript
export class SendTextMessageDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  @Matches(/^\d+@\w+\.net$/)
  remoteJid: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  text: string;
}
```

---

## API Documentation

### Swagger/OpenAPI
- **URL**: `http://localhost:3000/api/docs`
- **Autenticação**: Header `apikey` requerido para maioria dos endpoints
- **Schemas**: Todos os DTOs documentados com exemplos

### Endpoints Principais
```
POST   /sessions                    # Criar sessão
GET    /sessions                    # Listar sessões
GET    /sessions/:id/qrcode         # Obter QR code
DELETE /sessions/:id                # Remover sessão

POST   /messages/text               # Enviar texto
POST   /messages/image             # Enviar imagem
POST   /messages/audio              # Enviar áudio
POST   /messages/document          # Enviar documento

GET    /chats                       # Listar conversas
POST   /chats/:id/archive          # Arquivar conversa

GET    /contacts/validate/:number   # Validar número
GET    /groups/:id/metadata         # Metadados do grupo
```

---

## Troubleshooting

### Problemas Comuns

#### 1. Sessão não conecta
```bash
# Verificar logs
docker-compose logs -f postgres
npm run start:dev  # Observar logs da aplicação

# Verificar estado da sessão no banco
npx prisma studio
```

#### 2. QR Code inválido
- Limpar dados da sessão: `DELETE FROM "AuthState" WHERE sessionId = 'uuid'`
- Reiniciar aplicação para gerar novo QR code

#### 3. Mensagens não são enviadas
- Verificar status da sessão: deve ser `connected`
- Validar formato do `remoteJid`: `5511999998888@s.whatsapp.net`
- Verificar webhooks se há eventos de erro

#### 4. Performance lenta
```bash
# Indexes necessários no PostgreSQL
CREATE INDEX CONCURRENTLY idx_message_session_timestamp 
ON "Message" (sessionId, timestamp);

CREATE INDEX CONCURRENTLY idx_chat_session_unread 
ON "Chat" (sessionId, unreadCount);
```

### Debug e Monitoramento

#### Logs Estruturados
```typescript
// Logs incluem contexto automático
{
  "level": "error",
  "time": "2025-01-01T00:00:00.000Z",
  "service": "MessagesService",
  "sessionId": "uuid",
  "messageId": "msg-id",
  "error": "Connection timeout"
}
```

#### Health Checks
```bash
# Verificar se API está respondendo
curl http://localhost:3000/health

# Verificar conexão com banco
curl http://localhost:3000/health/database
```

---

## Recursos Externos

### Documentação Oficial
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Whaileys Documentation](https://github.com/pedroslopez/whatsapp-web.js)
- [Pino Logger](https://getpino.io)
- [Swagger/OpenAPI](https://swagger.io)

### Ferramentas Úteis
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [DBGate](http://localhost:3001) - Interface PostgreSQL via Docker
- [Postman](https://www.postman.com) - Testes de API
- [Docker Desktop](https://www.docker.com/products/docker-desktop) - Container management

---

## Contribuição e Melhorias

### Para Adicionar Novas Funcionalidades:

1. **Criar módulo**: `nest generate module new-feature`
2. **Criar DTOs**: Com validação using class-validator
3. **Implementar Service**: Com injeção de dependências
4. **Criar Controller**: Com guards e documentação
5. **Atualizar AGENTS.md**: Manter documentação atualizada

### Padrões de Code Review:
- Seguir convenções de命名 existentes
