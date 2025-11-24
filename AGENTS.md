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
8. [Logging Estruturado](#logging-estruturado)
9. [Exemplos Práticos](#exemplos-práticos)
10. [API Documentation](#api-documentation)
11. [Troubleshooting](#troubleshooting)

---

## Visão Geral da Arquitetura

### Stack Tecnológico
- **Backend**: NestJS 11+ (TypeScript)
- **Banco de Dados**: PostgreSQL 16 com Prisma ORM
- **WhatsApp Integration**: Whaileys
- **Logging**: Pino com configuração avançada e formato configurável
- **API Documentation**: Swagger/OpenAPI 3.0
- **Container**: Docker + Docker Compose

### Principais Características
- Multi-sessões WhatsApp independentes
- Sistema de webhooks configurável
- Persistência completa de mensagens e contatos
- Suporte a todos os tipos de mensagens WhatsApp
- Interface administrativa via API RESTful
- Logging estruturado com saída configurável (JSON/pretty)

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

# Variáveis de ambiente necessárias (criar .env baseado no .env.example)
cp .env.example .env
# Editar .env com suas configurações

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

### LoggerConfig e PinoLoggerService
```typescript
// Localização: src/logger/logger.config.ts
// Configuração avançada de logging baseada em ambiente
@Injectable()
export class LoggerConfig {
  createPinoOptions(): LoggerOptions {
    // Configuração dinâmica baseada em variáveis de ambiente
  }
}

// Localização: src/logger/logger.service.ts
// Implementação NestJS LoggerService com Pino
@Injectable()
export class PinoLoggerService implements LoggerService {
  // Logging estruturado com contexto automático
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

---

## Logging Estruturado

O projeto utiliza Pino Logger com configuração avançada baseada em variáveis de ambiente, suportando tanto saída JSON estruturada para produção quanto saída pretty para desenvolvimento.

### Variáveis de Ambiente
```env
# Nível de log: trace, debug, info, warn, error, fatal
LOG_LEVEL=info

# Formato de saída: pretty (console colorido), json (estruturado), mixed (adaptativo)
LOG_FORMAT=pretty

# Opções de formatação pretty
LOG_PRETTY_COLORIZE=true
LOG_PRETTY_SINGLE_LINE=true

# Opções de metadados estruturados
LOG_INCLUDE_TIMESTAMP=true
LOG_SERVICE_NAME=zpwoot
LOG_STRUCTURED_METADATA=true
```

### Formatos de Log Suportados

#### `pretty` - Desenvolvimento
- Saída colorida e formatada para console
- Timestamps em formato legível
- Single line para melhor readability
- Ideal para desenvolvimento local

#### `json` - Produção/Containers
- Saída JSON pura estruturada
- Metadados consistentes para log aggregators
- Otimizado para parsing automatizado
- Ideal para produção e ambientes containerizados

#### `mixed` - Adaptativo
- Detecta automaticamente TTY capability
- Pretty quando em terminal interativo
- JSON quando redirecionado para arquivo/pipe
- Flexível para diferentes cenários

### Melhores Práticas de Logging

#### 1. Logs Informativos com Contexto
```typescript
// Logs de operações importantes
this.logger.log(`Session ${sessionId} connected`, 'SessionsService');

// Logs com metadados estruturados
this.logger.log(
  `Message processed successfully`,
  { 
    sessionId, 
    messageId, 
    messageType, 
    processingTime: Date.now() - startTime 
  },
  'MessageProcessor'
);
```

#### 2. Logs de Erro com Detalhes
```typescript
// Sempre incluir objeto de erro quando disponível
this.logger.error(
  `Failed to send message to ${remoteJid}`,
  error,
  'MessagesService'
);

// Logs de erro com contexto adicional
this.logger.error(
  `Database connection failed`,
  { 
    error: error.message, 
    stack: error.stack,
    query: sqlQuery,
    params: queryParams 
  },
  'DatabaseService'
);
```

#### 3. Logs de Debug para Troubleshooting
```typescript
// Debug com informações detalhadas
this.logger.debug(
  `Processing webhook event`,
  { 
    eventType, 
    sessionId, 
    payload: JSON.stringify(eventPayload),
    processingId: generateId() 
  },
  'WebhookService'
);
```

#### 4. Logs de Performance
```typescript
const startTime = Date.now();
// ... operação ...
this.logger.log(
  `Operation completed`,
  { 
    operation: 'sendBulkMessages',
    duration: Date.now() - startTime,
    messageCount: messages.length,
    successCount: successCount,
    failureCount: failureCount 
  },
  'MessagesService'
);
```

### Estrutura de Log JSON (Produção)
```json
{
  "level": "info",
  "time": "2025-01-01T00:00:00.000Z",
  "service": "zpwoot",
  "version": "1.0.0",
  "environment": "production",
  "pid": 1234,
  "context": "SessionsService",
  "sessionId": "uuid-123",
  "msg": "Session connected successfully"
}
```

### Exemplos de Saída

#### Pretty Mode (Desenvolvimento)
```
[19:45:32.123] INFO (SessionsService): Session uuid-123 connected successfully
[19:45:32.124] ERROR (MessagesService): Failed to send message to 5511999998888@s.whatsapp.net
[19:45:32.125] DEBUG (WebhookService): Processing webhook event {eventType: "messages.upsert"}
```

#### JSON Mode (Produção)
```json
{"level":"info","time":"2025-01-01T19:45:32.123Z","service":"zpwoot","environment":"production","pid":1234,"context":"SessionsService","sessionId":"uuid-123","msg":"Session connected successfully"}
{"level":"error","time":"2025-01-01T19:45:32.124Z","service":"zpwoot","environment":"production","pid":1234,"context":"MessagesService","remoteJid":"5511999998888@s.whatsapp.net","err":{"message":"Connection timeout"},"msg":"Failed to send message"}
{"level":"debug","time":"2025-01-01T19:45:32.125Z","service":"zpwoot","environment":"production","pid":1234,"context":"WebhookService","eventType":"messages.upsert","msg":"Processing webhook event"}
```

---

## Exemplos Práticos

### Controller Completo com Logging
```typescript
@Controller('sessions')
@UseGuards(ApiKeyGuard)
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly logger: PinoLoggerService
  ) {
    this.logger.setContext('SessionsController');
  }

  @Post()
  async create(@Body() createSessionDto: CreateSessionDto) {
    this.logger.log(`Creating new session: ${createSessionDto.name}`);
    
    try {
      const result = await this.sessionsService.create(createSessionDto);
      this.logger.log(`Session created successfully: ${result.id}`, { sessionId: result.id });
      return result;
    } catch (error) {
      this.logger.error(`Failed to create session`, error, { name: createSessionDto.name });
      throw error;
    }
  }

  @Get(':id/qrcode')
  @Public()  // Endpoint público para QR code
  async getQrCode(@Param('id') id: string) {
    this.logger.debug(`QR code requested for session: ${id}`, { sessionId: id });
    
    const qrCode = await this.sessionsService.getQrCode(id);
    this.logger.log(`QR code generated for session: ${id}`, { sessionId: id });
    
    return qrCode;
  }
}
```

### Service com Repository e Logging Estruturado
```typescript
@Injectable()
export class MessagesService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly whatsappService: WhatsAppService,
    private readonly logger: PinoLoggerService
  ) {
    this.logger.setContext('MessagesService');
  }

  async sendTextMessage(dto: SendTextMessageDto) {
    const startTime = Date.now();
    
    this.logger.debug(`Starting message send operation`, {
      sessionId: dto.sessionId,
      remoteJid: dto.remoteJid,
      messageLength: dto.text.length
    });

    try {
      const session = await this.whatsappService.getSession(dto.sessionId);
      const result = await session.sendMessage(dto.remoteJid, {
        text: dto.text,
      });
      
      await this.messageRepository.create({
        ...dto,
        messageId: result.key.id,
        status: MessageStatus.SENT,
      });

      const duration = Date.now() - startTime;
      this.logger.log(
        `Message sent successfully`,
        {
          sessionId: dto.sessionId,
          messageId: result.key.id,
          remoteJid: dto.remoteJid,
          duration,
          messageType: 'text'
        }
      );
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed to send message`,
        error,
        {
          sessionId: dto.sessionId,
          remoteJid: dto.remoteJid,
          duration,
          errorType: error.constructor.name
        }
      );
      throw error;
    }
  }
}
```

### DTO Complexo com Validação
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
# Verificar logs com diferentes níveis
LOG_LEVEL=debug npm run start:dev

# Verificar logs específicos do serviço
grep "SessionsService" logs/app.log

# Verificar estado da sessão no banco
npx prisma studio
```

#### 2. QR Code inválido
- Limpar dados da sessão: `DELETE FROM "AuthState" WHERE sessionId = 'uuid'`
- Reiniciar aplicação para gerar novo QR code
- Verificar logs de autenticação com `LOG_LEVEL=debug`

#### 3. Mensagens não são enviadas
- Verificar status da sessão: deve ser `connected`
- Validar formato do `remoteJid`: `5511999998888@s.whatsapp.net`
- Verificar logs de erro no `MessagesService`
- Testar com `LOG_FORMAT=json` para melhor parsing

#### 4. Performance lenta
```bash
# Analisar logs de performance
grep "duration" logs/app.log | jq '.duration'

# Indexes necessários no PostgreSQL
CREATE INDEX CONCURRENTLY idx_message_session_timestamp 
ON "Message" (sessionId, timestamp);

CREATE INDEX CONCURRENTLY idx_chat_session_unread 
ON "Chat" (sessionId, unreadCount);
```

### Debug e Monitoramento

#### Análise de Logs Estruturados
```bash
# Filtrar logs por nível
jq 'select(.level == "error")' logs/app.log

# Filtrar por contexto
jq 'select(.context == "SessionsService")' logs/app.log

# Analisar performance
jq 'select(.duration) | {duration, operation, timestamp}' logs/app.log

# Contar erros por tipo
jq 'select(.level == "error") | .errorType' logs/app.log | sort | uniq -c
```

#### Health Checks
```bash
# Verificar se API está respondendo
curl http://localhost:3000/health

# Verificar conexão com banco
curl http://localhost:3000/health/database

# Verificar status das sessões
curl -H "apikey: $API_KEY" http://localhost:3000/sessions
```

#### Monitoramento em Produção
```bash
# Configuração recomendada para produção
LOG_LEVEL=info
LOG_FORMAT=json
LOG_STRUCTURED_METADATA=true
LOG_INCLUDE_TIMESTAMP=true

# Exemplo de configuração Docker
docker run -e LOG_LEVEL=warn -e LOG_FORMAT=json zpwoot:latest
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
- [jq](https://stedolan.github.io/jq/) - Processamento de JSON logs

---

## Contribuição e Melhorias

### Para Adicionar Novas Funcionalidades:

1. **Criar módulo**: `nest generate module new-feature`
2. **Criar DTOs**: Com validação usando class-validator
3. **Implementar Service**: Com injeção de dependências e logging estruturado
4. **Criar Controller**: Com guards, documentação e logging adequado
5. **Atualizar AGENTS.md**: Manter documentação atualizada

### Padrões de Code Review:
- Seguir convenções de nomenclatura existentes
- Incluir logging estruturado em operações importantes
- Adicionar metadados relevantes nos logs
- Usar níveis de log apropriados (debug, info, warn, error)
- Documentar novas variáveis de ambiente no .env.example

### Logging Guidelines:
- **DEBUG**: Informações detalhadas para troubleshooting
- **INFO**: Operações importantes e eventos de negócio
- **WARN**: Situações anômalas que não causam falha
- **ERROR**: Falhas que requerem atenção imediata
- **TRACE**: Detalhes extremamente granulares (desenvolvimento apenas)
