# Documentação Completa - Rotas do Módulo Session

## 📑 Índice
- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [DTOs e Tipos de Dados](#dtos-e-tipos-de-dados)
- [Endpoints](#endpoints)
- [Fluxos de Uso](#fluxos-de-uso)
- [Códigos de Status HTTP](#códigos-de-status-http)
- [Tratamento de Erros](#tratamento-de-erros)

---

## 📋 Visão Geral

**Base URL**: `/sessions`  
**Autenticação**: API Key obrigatória em todas as rotas  
**Content-Type**: `application/json`

O módulo Session gerencia o ciclo de vida completo das sessões WhatsApp, incluindo:
- Criação e gerenciamento de sessões
- Conexão/desconexão com WhatsApp
- Autenticação via QR Code
- Configuração de webhooks
- Status e monitoramento

---

## 🔐 Autenticação

### API Key Guard
Todas as rotas do módulo Session são protegidas por [`ApiKeyGuard`](../src/guards/api-key.guard.ts:4).

#### Métodos de Autenticação

**1. Header X-API-Key (Recomendado)**
```http
X-API-Key: your-secret-api-key-here
```

**2. Bearer Token**
```http
Authorization: Bearer your-secret-api-key-here
```

#### Configuração
A chave de API é configurada via variável de ambiente:
```bash
API_KEY="your-secret-api-key-here"
```

#### Erros de Autenticação
- **401 Unauthorized**: API key ausente
  ```json
  {
    "statusCode": 401,
    "message": "API key is missing"
  }
  ```

- **401 Unauthorized**: API key inválida
  ```json
  {
    "statusCode": 401,
    "message": "Invalid API key"
  }
  ```

---

## 📦 DTOs e Tipos de Dados

### SessionStatus (Enum)
```typescript
enum SessionStatus {
  disconnected = "disconnected",
  connecting = "connecting",
  connected = "connected"
}
```

### CreateSessionDto
**Arquivo**: [`src/modules/session/dto/create-session.dto.ts`](../src/modules/session/dto/create-session.dto.ts:4)

```typescript
{
  name: string;              // Obrigatório, único
  webhookUrl?: string;       // Opcional, deve ser URL válida
  webhookEvents?: string[];  // Opcional, array de strings
}
```

**Validações**:
- `name`: String obrigatória, deve ser única no sistema
- `webhookUrl`: URL válida (valida protocolo http/https)
- `webhookEvents`: Array de strings, cada elemento deve ser um evento válido

**Exemplo**:
```json
{
  "name": "my-whatsapp-session",
  "webhookUrl": "https://example.com/webhook",
  "webhookEvents": ["messages.upsert", "connection.update"]
}
```

### PairPhoneDto
**Arquivo**: [`src/modules/session/dto/pair-phone.dto.ts`](../src/modules/session/dto/pair-phone.dto.ts:4)

```typescript
{
  phoneNumber: string;  // Formato internacional obrigatório
}
```

**Validações**:
- Formato internacional: `+[código_país][número]`
- Regex: `/^\+?[1-9]\d{1,14}$/`
- Exemplos válidos: `+5511999999999`, `+14155552671`

**Exemplo**:
```json
{
  "phoneNumber": "+5511999999999"
}
```

### SessionResponseDto
**Arquivo**: [`src/modules/session/dto/session-response.dto.ts`](../src/modules/session/dto/session-response.dto.ts:4)

```typescript
{
  id: string;                    // UUID
  name: string;                  // Nome da sessão
  status: SessionStatus;         // Estado da conexão
  qrCode?: string | null;        // QR Code (se disponível)
  phoneNumber?: string | null;   // Número conectado
  webhookUrl?: string | null;    // URL do webhook
  webhookEvents: string[];       // Eventos configurados
  createdAt: Date;               // Data de criação
  updatedAt: Date;               // Última atualização
}
```

**Exemplo**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "my-whatsapp-session",
  "status": "connected",
  "qrCode": null,
  "phoneNumber": "+5511999999999",
  "webhookUrl": "https://example.com/webhook",
  "webhookEvents": ["messages.upsert"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:35:00.000Z"
}
```

### SessionStatusDto
**Arquivo**: [`src/modules/session/dto/session-response.dto.ts`](../src/modules/session/dto/session-response.dto.ts:33)

```typescript
{
  id: string;
  name: string;
  status: SessionStatus;
  phoneNumber?: string | null;
}
```

**Exemplo**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "my-whatsapp-session",
  "status": "connected",
  "phoneNumber": "+5511999999999"
}
```

### QRCodeResponseDto
**Arquivo**: [`src/modules/session/dto/session-response.dto.ts`](../src/modules/session/dto/session-response.dto.ts:47)

```typescript
{
  id: string;
  qrCode?: string | null;
  status: SessionStatus;
  message?: string;
}
```

**Exemplos**:

Quando QR Code está disponível:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "qrCode": "2@xYz123ABC...",
  "status": "connecting"
}
```

Quando já está conectado:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "qrCode": null,
  "status": "connected",
  "message": "Session is already connected"
}
```

Quando QR Code não está disponível:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "qrCode": null,
  "status": "disconnected",
  "message": "QR code not available. Make sure the session is connecting."
}
```

### WebhookEventsDto
**Arquivo**: [`src/modules/session/dto/session-response.dto.ts`](../src/modules/session/dto/session-response.dto.ts:61)

```typescript
{
  events: string[];
}
```

**Exemplo**:
```json
{
  "events": [
    "connection.update",
    "messages.upsert",
    "messages.update",
    "messages.delete",
    "message-receipt.update",
    "groups.upsert",
    "groups.update",
    "group-participants.update",
    "contacts.upsert",
    "contacts.update",
    "presence.update",
    "chats.upsert",
    "chats.update",
    "chats.delete"
  ]
}
```

### MessageResponseDto
**Arquivo**: [`src/modules/session/dto/session-response.dto.ts`](../src/modules/session/dto/session-response.dto.ts:66)

```typescript
{
  message: string;
}
```

**Exemplo**:
```json
{
  "message": "Session created successfully"
}
```

---

## 🌐 Endpoints

### 1. Listar Eventos de Webhook Disponíveis

**Endpoint**: `GET /sessions/webhook/events`  
**Controller**: [`SessionController.listWebhookEvents()`](../src/modules/session/session.controller.ts:43)  
**Service**: [`SessionService.listWebhookEvents()`](../src/modules/session/session.service.ts:336)

#### Descrição
Retorna a lista completa de eventos de webhook disponíveis que podem ser configurados para uma sessão.

#### Request
```http
GET /sessions/webhook/events HTTP/1.1
Host: localhost:3000
X-API-Key: your-secret-api-key-here
```

#### Response

**Status**: `200 OK`  
**Body**: [`WebhookEventsDto`](../src/modules/session/dto/session-response.dto.ts:61)

```json
{
  "events": [
    "connection.update",
    "messages.upsert",
    "messages.update",
    "messages.delete",
    "message-receipt.update",
    "groups.upsert",
    "groups.update",
    "group-participants.update",
    "contacts.upsert",
    "contacts.update",
    "presence.update",
    "chats.upsert",
    "chats.update",
    "chats.delete"
  ]
}
```

#### Eventos Disponíveis

| Evento | Descrição |
|--------|-----------|
| `connection.update` | Mudanças no status de conexão |
| `messages.upsert` | Novas mensagens recebidas ou enviadas |
| `messages.update` | Atualizações em mensagens existentes |
| `messages.delete` | Mensagens deletadas |
| `message-receipt.update` | Confirmações de leitura/entrega |
| `groups.upsert` | Novos grupos criados |
| `groups.update` | Atualizações em grupos |
| `group-participants.update` | Mudanças em participantes de grupos |
| `contacts.upsert` | Novos contatos adicionados |
| `contacts.update` | Atualizações em contatos |
| `presence.update` | Status de presença (online/offline) |
| `chats.upsert` | Novos chats criados |
| `chats.update` | Atualizações em chats |
| `chats.delete` | Chats deletados |

---

### 2. Criar Nova Sessão

**Endpoint**: `POST /sessions/create`  
**Controller**: [`SessionController.createSession()`](../src/modules/session/session.controller.ts:54)  
**Service**: [`SessionService.createSession()`](../src/modules/session/session.service.ts:38)

#### Descrição
Cria uma nova sessão WhatsApp no sistema. A sessão é criada com status `disconnected` e deve ser conectada posteriormente.

#### Request
```http
POST /sessions/create HTTP/1.1
Host: localhost:3000
X-API-Key: your-secret-api-key-here
Content-Type: application/json

{
  "name": "my-whatsapp-session",
  "webhookUrl": "https://example.com/webhook",
  "webhookEvents": ["messages.upsert", "connection.update"]
}
```

**Body**: [`CreateSessionDto`](../src/modules/session/dto/create-session.dto.ts:4)

#### Response

**Status**: `201 Created`  
**Body**: [`SessionResponseDto`](../src/modules/session/dto/session-response.dto.ts:4)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "my-whatsapp-session",
  "status": "disconnected",
  "qrCode": null,
  "phoneNumber": null,
  "webhookUrl": "https://example.com/webhook",
  "webhookEvents": ["messages.upsert", "connection.update"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Erros

**400 Bad Request** - Sessão com mesmo nome já existe
```json
{
  "statusCode": 400,
  "message": "Session with name \"my-whatsapp-session\" already exists"
}
```

**400 Bad Request** - Validação falhou
```json
{
  "statusCode": 400,
  "message": [
    "name must be a string",
    "webhookUrl must be a URL address"
  ],
  "error": "Bad Request"
}
```

#### Comportamento
1. Valida se já existe sessão com o mesmo `name`
2. Cria registro no banco de dados com status `disconnected`
3. Retorna os dados da sessão criada (sem credenciais)
4. **Não inicia conexão automaticamente** - requer chamada a `/sessions/:id/connect`

---

### 3. Listar Todas as Sessões

**Endpoint**: `GET /sessions/list`  
**Controller**: [`SessionController.getSessions()`](../src/modules/session/session.controller.ts:67)  
**Service**: [`SessionService.findAll()`](../src/modules/session/session.service.ts:79)

#### Descrição
Retorna lista de todas as sessões cadastradas no sistema.

#### Request
```http
GET /sessions/list HTTP/1.1
Host: localhost:3000
X-API-Key: your-secret-api-key-here
```

#### Response

**Status**: `200 OK`  
**Body**: Array de [`SessionResponseDto`](../src/modules/session/dto/session-response.dto.ts:4)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "session-1",
    "status": "connected",
    "phoneNumber": "+5511999999999",
    "webhookUrl": "https://example.com/webhook",
    "webhookEvents": ["messages.upsert"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "session-2",
    "status": "disconnected",
    "phoneNumber": null,
    "webhookUrl": null,
    "webhookEvents": [],
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
]
```

#### Comportamento
- Retorna array vazio `[]` se não houver sessões
- Não expõe credenciais (`creds`) ou QR codes
- Mostra status atual de cada sessão

---

### 4. Obter Detalhes de uma Sessão

**Endpoint**: `GET /sessions/:id/info`  
**Controller**: [`SessionController.getSession()`](../src/modules/session/session.controller.ts:83)  
**Service**: [`SessionService.findOne()`](../src/modules/session/session.service.ts:97)

#### Descrição
Retorna informações detalhadas de uma sessão específica.

#### Request
```http
GET /sessions/550e8400-e29b-41d4-a716-446655440000/info HTTP/1.1
Host: localhost:3000
X-API-Key: your-secret-api-key-here
```

**Path Parameters**:
- `id` (string, UUID): ID da sessão

#### Response

**Status**: `200 OK`  
**Body**: [`SessionResponseDto`](../src/modules/session/dto/session-response.dto.ts:4)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "my-whatsapp-session",
  "status": "connected",
  "qrCode": null,
  "phoneNumber": "+5511999999999",
  "webhookUrl": "https://example.com/webhook",
  "webhookEvents": ["messages.upsert", "connection.update"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:35:00.000Z"
}
```

#### Erros

**404 Not Found** - Sessão não encontrada
```json
{
  "statusCode": 404,
  "message": "Session with ID \"550e8400-e29b-41d4-a716-446655440000\" not found"
}
```

---

### 5. Deletar Sessão

**Endpoint**: `DELETE /sessions/:id/delete`  
**Controller**: [`SessionController.deleteSession()`](../src/modules/session/session.controller.ts:96)  
**Service**: [`SessionService.deleteSession()`](../src/modules/session/session.service.ts:123)

#### Descrição
Remove uma sessão do sistema. Se a sessão estiver conectada, desconecta antes de deletar.

#### Request
```http
DELETE /sessions/550e8400-e29b-41d4-a716-446655440000/delete HTTP/1.1
Host: localhost:3000
X-API-Key: your-secret-api-key-here
```

**Path Parameters**:
- `id` (string, UUID): ID da sessão

#### Response

**Status**: `200 OK`  
**Body**: [`MessageResponseDto`](../src/modules/session/dto/session-response.dto.ts:66)

```json
{
  "message": "Session deleted successfully"
}
```

#### Erros

**404 Not Found** - Sessão não encontrada
```json
{
  "statusCode": 404,
  "message": "Session with ID \"550e8400-e29b-41d4-a716-446655440000\" not found"
}
```

#### Comportamento
1. Verifica se a sessão existe
2. Se estiver conectada, chama [`WhatsService.disconnect()`](../src/whats/whats.service.ts:193)
3. Remove registro do banco de dados (cascade remove webhookConfigs e proxyConfig)
4. Remove da memória (Map de sessions ativas)

---

### 6. Conectar Sessão ao WhatsApp

**Endpoint**: `POST /sessions/:id/connect`  
**Controller**: [`SessionController.connectSession()`](../src/modules/session/session.controller.ts:109)  
**Service**: [`SessionService.connectSession()`](../src/modules/session/session.service.ts:144)

#### Descrição
Inicia o processo de conexão com WhatsApp. Gera QR Code para autenticação ou reconecta usando credenciais salvas.

#### Request
```http
POST /sessions/550e8400-e29b-41d4-a716-446655440000/connect HTTP/1.1
Host: localhost:3000
X-API-Key: your-secret-api-key-here
```

**Path Parameters**:
- `id` (string, UUID): ID da sessão

#### Response

**Status**: `201 Created`  
**Body**: [`MessageResponseDto`](../src/modules/session/dto/session-response.dto.ts:66)

```json
{
  "message": "Session connection initiated"
}
```

#### Erros

**404 Not Found** - Sessão não encontrada
```json
{
  "statusCode": 404,
  "message": "Session with ID \"550e8400-e29b-41d4-a716-446655440000\" not found"
}
```

**400 Bad Request** - Sessão já conectada
```json
{
  "statusCode": 400,
  "message": "Session is already connected"
}
```

#### Comportamento

1. **Verifica se já está conectada**
   - Se sim, retorna erro 400

2. **Carrega estado de autenticação do banco**
   - Via [`useDatabaseAuthState()`](../src/whats/database-auth-state.ts:72)
   - Se existem credenciais, tenta reconectar automaticamente
   - Se não, inicia novo processo de autenticação

3. **Cria conexão WhatsApp**
   - Via [`WhatsService.createConnection()`](../src/whats/whats.service.ts:32)
   - Registra callback para salvar credenciais
   - Atualiza status para `connecting`

4. **Eventos Subsequentes**
   - `connection.update` → QR Code gerado (se primeira vez)
   - `connection.update` → Status muda para `connected` após scan
   - `creds.update` → Credenciais salvas no banco

**Fluxo**:
```mermaid
graph TD
    A[POST /connect] --> B{Já conectada?}
    B -->|Sim| C[400 Bad Request]
    B -->|Não| D[Carregar auth state do DB]
    D --> E{Tem credenciais?}
    E -->|Sim| F[Tentar reconexão]
    E -->|Não| G[Iniciar nova conexão]
    F --> H[Status: connecting]
    G --> H
    H --> I[Gerar QR Code]
    I --> J[Aguardar scan]
    J --> K[Status: connected]
    K --> L[Salvar credenciais]
```

---

### 7. Desconectar Sessão do WhatsApp

**Endpoint**: `POST /sessions/:id/disconnect`  
**Controller**: [`SessionController.disconnectSession()`](../src/modules/session/session.controller.ts:120)  
**Service**: [`SessionService.disconnectSession()`](../src/modules/session/session.service.ts:195)

#### Descrição
Desconecta a sessão do WhatsApp mas **mantém as credenciais** para reconexão futura.

#### Request
```http
POST /sessions/550e8400-e29b-41d4-a716-446655440000/disconnect HTTP/1.1
Host: localhost:3000
X-API-Key: your-secret-api-key-here
```

**Path Parameters**:
- `id` (string, UUID): ID da sessão

#### Response

**Status**: `201 Created`  
**Body**: [`MessageResponseDto`](../src/modules/session/dto/session-response.dto.ts:66)

```json
{
  "message": "Session disconnected successfully"
}
```

#### Erros

**404 Not Found** - Sessão não encontrada
```json
{
  "statusCode": 404,
  "message": "Session with ID \"550e8400-e29b-41d4-a716-446655440000\" not found"
}
```

**400 Bad Request** - Sessão não está conectada
```json
{
  "statusCode": 400,
  "message": "Session is not connected"
}
```

#### Comportamento
1. Chama [`WhatsService.disconnect()`](../src/whats/whats.service.ts:193)
2. Executa `logout()` no socket WhatsApp
3. Remove da memória (Map de sessions)
4. Atualiza status no DB para `disconnected`
5. Remove QR Code do DB
6. **Mantém credenciais** - pode reconectar com `/connect`

**Diferença entre disconnect e logout**:
- `disconnect`: Mantém credenciais, pode reconectar
- `logout`: Remove credenciais, requer novo QR Code

---

### 8. Obter QR Code

**Endpoint**: `GET /sessions/:id/qr`  
**Controller**: [`SessionController.getQRCode()`](../src/modules/session/session.controller.ts:136)  
**Service**: [`SessionService.getQRCode()`](../src/modules/session/session.service.ts:217)

#### Descrição
Retorna o QR Code atual da sessão para autenticação no WhatsApp.

#### Request
```http
GET /sessions/550e8400-e29b-41d4-a716-446655440000/qr HTTP/1.1
Host: localhost:3000
X-API-Key: your-secret-api-key-here
```

**Path Parameters**:
- `id` (string, UUID): ID da sessão

#### Response

**Status**: `200 OK`  
**Body**: [`QRCodeResponseDto`](../src/modules/session/dto/session-response.dto.ts:47)

**Cenário 1: QR Code disponível** (sessão connecting)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "qrCode": "2@xYz123ABC...",
  "status": "connecting"
}
```

**Cenário 2: Já conectado**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "qrCode": null,
  "status": "connected",
  "message": "Session is already connected"
}
```

**Cenário 3: QR Code não disponível** (sessão disconnected)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "qrCode": null,
  "status": "disconnected",
  "message": "QR code not available. Make sure the session is connecting."
}
```

#### Erros

**404 Not Found** - Sessão não encontrada
```json
{
  "statusCode": 404,
  "message": "Session with ID \"550e8400-e29b-41d4-a716-446655440000\" not found"
}
```

#### Comportamento
1. Busca QR Code na memória via [`WhatsService.getQRCode()`](../src/whats/whats.service.ts:143)
2. Se encontrado, atualiza no banco de dados
3. Retorna status atual e QR Code (se disponível)

**Ciclo de vida do QR Code**:
- Gerado após `/connect` se não tem credenciais
- Expira após ~60 segundos
- Removido após autenticação bem-sucedida
- Novo QR Code gerado a cada tentativa de conexão

**Como usar o QR Code**:
```javascript
// Exemplo de uso em frontend
const response = await fetch('/sessions/{id}/qr');
const data = await response.json();

if (data.qrCode) {
  // Gerar imagem do QR Code
  QRCode.toCanvas(canvas, data.qrCode);
  
  // Polling para verificar conexão
  const interval = setInterval(async () => {
    const status = await fetch('/sessions/{id}/status');
    const statusData = await status.json();
    
    if (statusData.status === 'connected') {
      clearInterval(interval);
      console.log('Conectado!');
    }
  }, 2000);
}
```

---

### 9. Parear com Número de Telefone

**Endpoint**: `POST /sessions/:id/pair`  
**Controller**: [`SessionController.pairPhone()`](../src/modules/session/session.controller.ts:150)  
**Service**: [`SessionService.pairPhone()`](../src/modules/session/session.service.ts:257)

#### Descrição
⚠️ **RECURSO PARCIALMENTE IMPLEMENTADO**  
Inicia o processo de pareamento usando número de telefone ao invés de QR Code.

#### Request
```http
POST /sessions/550e8400-e29b-41d4-a716-446655440000/pair HTTP/1.1
Host: localhost:3000
X-API-Key: your-secret-api-key-here
Content-Type: application/json

{
  "phoneNumber": "+5511999999999"
}
```

**Path Parameters**:
- `id` (string, UUID): ID da sessão

**Body**: [`PairPhoneDto`](../src/modules/session/dto/pair-phone.dto.ts:4)

#### Response

**Status**: `201 Created`  
**Body**: [`MessageResponseDto`](../src/modules/session/dto/session-response.dto.ts:66)

```json
{
  "message": "Phone pairing initiated"
}
```

#### Erros

**404 Not Found** - Sessão não encontrada
```json
{
  "statusCode": 404,
  "message": "Session with ID \"550e8400-e29b-41d4-a716-446655440000\" not found"
}
```

**400 Bad Request** - Sessão não conectada
```json
{
  "statusCode": 400,
  "message": "Session is not connected. Connect first."
}
```

**400 Bad Request** - Formato de telefone inválido
```json
{
  "statusCode": 400,
  "message": [
    "Phone number must be in international format (e.g., +5511999999999)"
  ],
  "error": "Bad Request"
}
```

#### ⚠️ Status de Implementação
**Implementação Atual**:
- ✅ Validação de formato de telefone
- ✅ Atualização do número no banco de dados
- ❌ Integração com whaileys para pareamento real
- ❌ Envio de código de verificação

**Código Fonte** ([`session.service.ts:257`](../src/modules/session/session.service.ts:257)):
```typescript
// TODO: Implement phone pairing with whaileys
// This feature may require specific whaileys support
```

**Próximos Passos**:
1. Verificar se whaileys v6.4.2 suporta pareamento por telefone
2. Implementar lógica de envio de código
3. Criar endpoint para validar código recebido
4. Atualizar documentação com fluxo completo

---

### 10. Obter Status da Sessão

**Endpoint**: `GET /sessions/:id/status`  
**Controller**: [`SessionController.getSessionStatus()`](../src/modules/session/session.controller.ts:167)  
**Service**: [`SessionService.getSessionStatus()`](../src/modules/session/session.service.ts:281)

#### Descrição
Retorna o status atual de conexão da sessão.

#### Request
```http
GET /sessions/550e8400-e29b-41d4-a716-446655440000/status HTTP/1.1
Host: localhost:3000
X-API-Key: your-secret-api-key-here
```

**Path Parameters**:
- `id` (string, UUID): ID da sessão

#### Response

**Status**: `200 OK`  
**Body**: [`SessionStatusDto`](../src/modules/session/dto/session-response.dto.ts:33)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "my-whatsapp-session",
  "status": "connected",
  "phoneNumber": "+5511999999999"
}
```

#### Erros

**404 Not Found** - Sessão não encontrada
```json
{
  "statusCode": 404,
  "message": "Session with ID \"550e8400-e29b-41d4-a716-446655440000\" not found"
}
```

#### Comportamento
1. Busca status em tempo real via [`WhatsService.getConnectionStatus()`](../src/whats/whats.service.ts:150)
2. Mapeia status do WhatsApp para [`SessionStatus`](../src/modules/session/session.service.ts:340):
   - `open` → `connected`
   - `connecting` → `connecting`
   - `close` → `disconnected`
3. Se status mudou, atualiza no banco de dados
4. Retorna status mais recente

**Casos de Uso**:
- Polling para verificar quando QR Code foi escaneado
- Monitoramento de saúde da conexão
- Dashboard de status de múltiplas sessões

**Exemplo de Polling**:
```javascript
// Verificar status a cada 2 segundos
const checkStatus = setInterval(async () => {
  const response = await fetch('/sessions/{id}/status', {
    headers: { 'X-API-Key': 'your-key' }
  });
  const data = await response.json();
  
  console.log(`Status: ${data.status}`);
  
  if (data.status === 'connected') {
    clearInterval(checkStatus);
    console.log('Conectado com sucesso!');
  }
}, 2000);
```

---

### 11. Fazer Logout da Sessão

**Endpoint**: `POST /sessions/:id/logout`  
**Controller**: [`SessionController.logoutSession()`](../src/modules/session/session.controller.ts:180)  
**Service**: [`SessionService.logoutSession()`](../src/modules/session/session.service.ts:305)

#### Descrição
Faz logout completo da sessão, **removendo todas as credenciais**. Diferente de disconnect, requer novo QR Code para reconexão.

#### Request
```http
POST /sessions/550e8400-e29b-41d4-a716-446655440000/logout HTTP/1.1
Host: localhost:3000
X-API-Key: your-secret-api-key-here
```

**Path Parameters**:
- `id` (string, UUID): ID da sessão

#### Response

**Status**: `201 Created`  
**Body**: [`MessageResponseDto`](../src/modules/session/dto/session-response.dto.ts:66)

```json
{
  "message": "Session logged out successfully"
}
```

#### Erros

**404 Not Found** - Sessão não encontrada
```json
{
  "statusCode": 404,
  "message": "Session with ID \"550e8400-e29b-41d4-a716-446655440000\" not found"
}
```

#### Comportamento
1. Se socket existe, chama [`WhatsService.disconnect()`](../src/whats/whats.service.ts:193)
   - Ignora erros de desconexão (continua mesmo se falhar)
2. Limpa credenciais do banco de dados:
   ```typescript
   {
     status: SessionStatus.disconnected,
     qrCode: null,
     phoneNumber: null,
     creds: Prisma.DbNull  // Remove todas as credenciais
   }
   ```
3. Remove da memória (Map de sessions)

**Diferença entre Operações**:

| Operação | Mantém Credenciais | Pode Reconectar | Requer QR Code |
|----------|-------------------|-----------------|----------------|
| `disconnect` | ✅ Sim | ✅ Sim | ❌ Não |
| `logout` | ❌ Não | ❌ Não | ✅ Sim |
| `delete` | ❌ Não | ❌ Não | N/A (sessão removida) |

**Quando usar**:
- **disconnect**: Pausa temporária (ex: manutenção)
- **logout**: Trocar de conta WhatsApp
- **delete**: Remover sessão permanentemente

---

## 🔄 Fluxos de Uso

### Fluxo 1: Primeira Conexão (QR Code)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as zpwoot API
    participant WA as WhatsApp
    participant DB as Database

    C->>API: POST /sessions/create
    API->>DB: Criar sessão
    DB-->>API: Session criada
    API-->>C: 201 SessionResponseDto

    C->>API: POST /sessions/:id/connect
    API->>WA: Iniciar conexão
    WA-->>API: QR Code gerado
    API->>DB: Salvar status=connecting
    API-->>C: 201 Connection initiated

    C->>API: GET /sessions/:id/qr
    API-->>C: 200 QRCodeResponseDto
    
    Note over C: Usuário escaneia QR Code
    
    WA->>API: connection.update (open)
    API->>DB: Salvar status=connected
    WA->>API: creds.update
    API->>DB: Salvar credenciais
    
    C->>API: GET /sessions/:id/status
    API-->>C: 200 status=connected
```

**Passos Detalhados**:

1. **Criar Sessão**
   ```bash
   curl -X POST http://localhost:3000/sessions/create \
     -H "X-API-Key: your-key" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "minha-sessao",
       "webhookUrl": "https://example.com/webhook",
       "webhookEvents": ["messages.upsert"]
     }'
   ```

2. **Iniciar Conexão**
   ```bash
   curl -X POST http://localhost:3000/sessions/{id}/connect \
     -H "X-API-Key: your-key"
   ```

3. **Obter QR Code** (polling a cada 2s)
   ```bash
   curl http://localhost:3000/sessions/{id}/qr \
     -H "X-API-Key: your-key"
   ```

4. **Verificar Status** (polling até connected)
   ```bash
   curl http://localhost:3000/sessions/{id}/status \
     -H "X-API-Key: your-key"
   ```

---

### Fluxo 2: Reconexão (Com Credenciais)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as zpwoot API
    participant WA as WhatsApp
    participant DB as Database

    C->>API: POST /sessions/:id/connect
    API->>DB: Buscar credenciais
    DB-->>API: Credenciais existentes
    API->>WA: Reconectar com credenciais
    API->>DB: Atualizar status=connecting
    API-->>C: 201 Connection initiated
    
    WA->>API: connection.update (open)
    API->>DB: Atualizar status=connected
    
    C->>API: GET /sessions/:id/status
    API-->>C: 200 status=connected
```

**Características**:
- ✅ Não requer QR Code
- ✅ Conexão mais rápida (~2-5 segundos)
- ✅ Usa credenciais salvas no banco
- ⚠️ Se credenciais expiraram, volta ao Fluxo 1

---

### Fluxo 3: Desconexão Temporária

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as zpwoot API
    participant WA as WhatsApp
    participant DB as Database

    Note over C,DB: Sessão está connected

    C->>API: POST /sessions/:id/disconnect
    API->>WA: Logout do socket
    API->>DB: status=disconnected, qrCode=null
    Note over DB: Credenciais mantidas
    API-->>C: 201 Disconnected successfully

    Note over C: Mais tarde...

    C->>API: POST /sessions/:id/connect
    API->>DB: Buscar credenciais
    DB-->>API: Credenciais preservadas
    API->>WA: Reconectar
    API-->>C: 201 Connection initiated
```

**Uso**:
- Manutenção programada
- Troca de servidor
- Economia de recursos temporária

---

### Fluxo 4: Logout Completo

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as zpwoot API
    participant WA as WhatsApp
    participant DB as Database

    C->>API: POST /sessions/:id/logout
    API->>WA: Logout do socket
    API->>DB: status=disconnected<br/>creds=NULL<br/>qrCode=NULL<br/>phoneNumber=NULL
    API-->>C: 201 Logged out successfully

    Note over C: Para reconectar, precisa de novo QR Code

    C->>API: POST /sessions/:id/connect
    API->>DB: Buscar credenciais
    DB-->>API: Sem credenciais
    API->>WA: Nova conexão
    WA-->>API: Novo QR Code
    API-->>C: 201 Connection initiated
```

**Uso**:
- Trocar conta WhatsApp
- Problemas de autenticação
- Requisito de segurança

---

### Fluxo 5: Monitoramento de Status

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as zpwoot API
    participant WA as WhatsApp

    loop Polling a cada 2s
        C->>API: GET /sessions/:id/status
        API->>WA: Verificar conexão
        WA-->>API: Status atual
        API-->>C: SessionStatusDto
    end

    Note over WA: Desconexão inesperada
    WA->>API: connection.update (close)
    
    C->>API: GET /sessions/:id/status
    API-->>C: status=disconnected

    Note over API: Reconexão automática
    API->>WA: Tentar reconectar
```

**Polling Recomendado**:
```javascript
// Intervalo de 2-5 segundos
setInterval(async () => {
  const status = await getSessionStatus(sessionId);
  updateUI(status);
}, 2000);
```

---

## 📊 Códigos de Status HTTP

### Respostas de Sucesso

| Código | Significado | Uso |
|--------|-------------|-----|
| `200 OK` | Sucesso | GET requests (list, info, status, qr, webhook/events) |
| `201 Created` | Recurso criado/ação realizada | POST requests (create, connect, disconnect, pair, logout) |

### Respostas de Erro

| Código | Significado | Causas Comuns |
|--------|-------------|---------------|
| `400 Bad Request` | Requisição inválida | Validação falhou, sessão já existe, já conectada |
| `401 Unauthorized` | Não autorizado | API key ausente ou inválida |
| `404 Not Found` | Não encontrado | Session ID não existe |
| `500 Internal Server Error` | Erro no servidor | Erro no WhatsApp, banco de dados, etc. |

---

## ⚠️ Tratamento de Erros

### Estrutura de Erro Padrão

```typescript
{
  statusCode: number;
  message: string | string[];
  error?: string;
}
```

### Erros por Categoria

#### 1. Erros de Autenticação (401)

**API Key Ausente**
```json
{
  "statusCode": 401,
  "message": "API key is missing"
}
```

**API Key Inválida**
```json
{
  "statusCode": 401,
  "message": "Invalid API key"
}
```

**Solução**: Verificar variável `API_KEY` no `.env`

---

#### 2. Erros de Validação (400)

**Nome de Sessão Duplicado**
```json
{
  "statusCode": 400,
  "message": "Session with name \"my-session\" already exists"
}
```

**Webhook URL Inválida**
```json
{
  "statusCode": 400,
  "message": [
    "webhookUrl must be a URL address"
  ],
  "error": "Bad Request"
}
```

**Telefone em Formato Inválido**
```json
{
  "statusCode": 400,
  "message": [
    "Phone number must be in international format (e.g., +5511999999999)"
  ],
  "error": "Bad Request"
}
```

**Sessão Já Conectada**
```json
{
  "statusCode": 400,
  "message": "Session is already connected"
}
```

**Sessão Não Conectada**
```json
{
  "statusCode": 400,
  "message": "Session is not connected"
}
```

**Sessão Não Conectada (Para Pair)**
```json
{
  "statusCode": 400,
  "message": "Session is not connected. Connect first."
}
```

---

#### 3. Erros de Recurso Não Encontrado (404)

**Sessão Não Encontrada**
```json
{
  "statusCode": 404,
  "message": "Session with ID \"550e8400-e29b-41d4-a716-446655440000\" not found"
}
```

**Solução**: Verificar se ID é válido com `GET /sessions/list`

---

#### 4. Erros de Servidor (500)

**Erro de Configuração**
```json
{
  "statusCode": 500,
  "message": "API_KEY environment variable is not set"
}
```

**Erro de Banco de Dados**
```json
{
  "statusCode": 500,
  "message": "Database connection failed"
}
```

**Erro do WhatsApp**
```json
{
  "statusCode": 500,
  "message": "Failed to create connection for session {id}: [error details]"
}
```

**Logs Relacionados** ([`whats.service.ts:78`](../src/whats/whats.service.ts:78)):
```
[WhatsService] Failed to create connection for session {id}: Error: ...
```

---

### Tratamento de Erros no Cliente

```javascript
async function createSession(sessionData) {
  try {
    const response = await fetch('/sessions/create', {
      method: 'POST',
      headers: {
        'X-API-Key': 'your-key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sessionData)
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 400:
          console.error('Validação falhou:', error.message);
          break;
        case 401:
          console.error('API key inválida');
          break;
        case 404:
          console.error('Sessão não encontrada');
          break;
        case 500:
          console.error('Erro no servidor:', error.message);
          break;
      }
      
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
}
```

---

## 🔧 Configurações Avançadas

### Webhooks

**Estrutura no Banco** ([`schema.prisma:34`](../prisma/schema.prisma:34)):
```prisma
model WebhookConfig {
  id        String   @id @default(uuid())
  url       String
  events    String[]
  enabled   Boolean  @default(true)
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
```

**Status de Implementação**: 🚧 Estrutura criada, disparo não implementado

**Eventos Disponíveis**:
- `connection.update` - Mudanças de status
- `messages.upsert` - Novas mensagens
- `messages.update` - Mensagens atualizadas
- `messages.delete` - Mensagens deletadas
- `message-receipt.update` - Confirmações
- `groups.*` - Eventos de grupos
- `contacts.*` - Eventos de contatos
- `chats.*` - Eventos de chats
- `presence.update` - Status online/offline

---

### Proxy

**Estrutura no Banco** ([`schema.prisma:49`](../prisma/schema.prisma:49)):
```prisma
model ProxyConfig {
  id        String   @id @default(uuid())
  host      String
  port      Int
  username  String?
  password  String?
  protocol  String   @default("http")
  sessionId String   @unique
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
```

**Status de Implementação**: 🚧 Schema criado, integração pendente

**Formato Esperado**:
```json
{
  "host": "proxy.example.com",
  "port": 8080,
  "username": "user",
  "password": "pass",
  "protocol": "http"
}
```

---

## 📝 Notas de Implementação

### Reconexão Automática

**Código** ([`whats.service.ts:106`](../src/whats/whats.service.ts:106)):
```typescript
if (connection === 'close') {
  const shouldReconnect =
    lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

  if (shouldReconnect) {
    setTimeout(() => this.createConnection(sessionId), 3000);
  }
}
```

**Comportamento**:
- ✅ Reconecta após 3 segundos se não foi logout manual
- ✅ Não reconecta se foi logout intencional
- ✅ Mantém credenciais durante reconexão

---

### Armazenamento de Credenciais

**Implementação** ([`database-auth-state.ts`](../src/whats/database-auth-state.ts:7)):
- Credenciais armazenadas em campo JSON no banco
- Substituiu storage baseado em arquivos
- Callback para salvar atualizações automáticas

**Estrutura**:
```json
{
  "creds": {
    "noiseKey": { ... },
    "signedIdentityKey": { ... },
    "signedPreKey": { ... },
    "registrationId": 12345,
    "advSecretKey": "...",
    "me": { "id": "...", "name": "..." }
  },
  "keys": {
    "pre-keys": { ... },
    "session-keys": { ... },
    "sender-keys": { ... },
    "app-state-sync-keys": { ... }
  }
}
```

---

### Limitações Conhecidas

1. **Pareamento por Telefone**: Não implementado
2. **Webhooks**: Não disparam eventos
3. **Proxy**: Schema existe mas não é usado
4. **Rate Limiting**: Não implementado
5. **Múltiplas API Keys**: Apenas uma global
6. **Backup de Credenciais**: Não automatizado
7. **Logs Estruturados**: Logger básico do NestJS
8. **Métricas**: Não implementado

---

## 🎯 Exemplos Práticos

### Exemplo Completo: Cliente JavaScript

```javascript
class ZpwootClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  // Criar e conectar sessão
  async createAndConnect(name, webhookUrl) {
    // 1. Criar sessão
    const session = await this.request('/sessions/create', {
      method: 'POST',
      body: JSON.stringify({
        name,
        webhookUrl,
        webhookEvents: ['messages.upsert', 'connection.update']
      })
    });

    console.log('Sessão criada:', session.id);

    // 2. Conectar
    await this.request(`/sessions/${session.id}/connect`, {
      method: 'POST'
    });

    // 3. Aguardar QR Code
    let qrCode = null;
    while (!qrCode) {
      const qrResponse = await this.request(`/sessions/${session.id}/qr`);
      if (qrResponse.qrCode) {
        qrCode = qrResponse.qrCode;
        console.log('QR Code:', qrCode);
        // Exibir QR Code para usuário
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // 4. Aguardar conexão
    while (true) {
      const status = await this.request(`/sessions/${session.id}/status`);
      console.log('Status:', status.status);
      
      if (status.status === 'connected') {
        console.log('Conectado!', status.phoneNumber);
        break;
      }
      
      await new Promise(r => setTimeout(r, 2000));
    }

    return session;
  }

  // Listar todas as sessões
  async listSessions() {
    return this.request('/sessions/list');
  }

  // Verificar status
  async getStatus(sessionId) {
    return this.request(`/sessions/${sessionId}/status`);
  }

  // Desconectar
  async disconnect(sessionId) {
    return this.request(`/sessions/${sessionId}/disconnect`, {
      method: 'POST'
    });
  }

  // Logout
  async logout(sessionId) {
    return this.request(`/sessions/${sessionId}/logout`, {
      method: 'POST'
    });
  }

  // Deletar
  async delete(sessionId) {
    return this.request(`/sessions/${sessionId}/delete`, {
      method: 'DELETE'
    });
  }
}

// Uso
const client = new ZpwootClient(
  'http://localhost:3000',
  'your-api-key'
);

// Criar e conectar
const session = await client.createAndConnect(
  'my-session',
  'https://example.com/webhook'
);

// Listar sessões
const sessions = await client.listSessions();
console.log('Sessões ativas:', sessions.length);

// Verificar status
const status = await client.getStatus(session.id);
console.log('Status:', status);
```

---

## 📚 Referências

### Arquivos de Código
- Controller: [`src/modules/session/session.controller.ts`](../src/modules/session/session.controller.ts:1)
- Service: [`src/modules/session/session.service.ts`](../src/modules/session/session.service.ts:1)
- DTOs: [`src/modules/session/dto/`](../src/modules/session/dto/)
- WhatsApp Service: [`src/whats/whats.service.ts`](../src/whats/whats.service.ts:1)
- Auth State: [`src/whats/database-auth-state.ts`](../src/whats/database-auth-state.ts:1)
- API Key Guard: [`src/guards/api-key.guard.ts`](../src/guards/api-key.guard.ts:1)

### Schema do Banco
- Prisma Schema: [`prisma/schema.prisma`](../prisma/schema.prisma:1)

### Bibliotecas
- **whaileys**: v6.4.2 (fork do Baileys para WhatsApp Web)
- **NestJS**: v11.0.1
- **Prisma**: v7.0.0
- **class-validator**: Validações de DTOs

---

**Documentação gerada em**: 2024-01-15  
**Versão da API**: 1.0  
**Status**: ✅ Completo