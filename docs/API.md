# Zpwoot API Documentation

Documentação completa da API REST do Zpwoot para gerenciamento de sessões WhatsApp.

**Base URL:** `http://localhost:3000`  
**Swagger:** `http://localhost:3000/api/docs`  
**Autenticação:** Header `apikey: YOUR_API_KEY`

---

## Índice

1. [Autenticação](#autenticação)
2. [Sessões](#sessões)
3. [Chatwoot](#chatwoot)
4. [Mensagens](#mensagens)
5. [Grupos](#grupos)
6. [Contatos](#contatos)
7. [Webhooks](#webhooks)
8. [Fluxos Completos](#fluxos-completos)

---

## Autenticação

Todas as requisições (exceto webhooks públicos) requerem o header `apikey`:

```bash
curl -X GET "http://localhost:3000/sessions/list" \
  -H "apikey: YOUR_API_KEY"
```

---

## Sessões

### Criar Sessão

```bash
POST /sessions/create
```

```bash
curl -X POST "http://localhost:3000/sessions/create" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Minha Sessão WhatsApp"
  }'
```

**Response:**
```json
{
  "id": "609018e2-6de6-478c-94d1-a0e66829982b",
  "name": "Minha Sessão WhatsApp",
  "status": "disconnected",
  "phone": null,
  "chatwoot": null,
  "createdAt": "2025-11-26T12:00:00.000Z",
  "updatedAt": "2025-11-26T12:00:00.000Z"
}
```

### Listar Sessões

```bash
GET /sessions/list
```

```bash
curl -X GET "http://localhost:3000/sessions/list" \
  -H "apikey: YOUR_API_KEY"
```

### Obter Sessão

```bash
GET /sessions/:id/info
```

```bash
curl -X GET "http://localhost:3000/sessions/609018e2-6de6-478c-94d1-a0e66829982b/info" \
  -H "apikey: YOUR_API_KEY"
```

### Conectar Sessão

```bash
POST /sessions/:id/connect
```

```bash
curl -X POST "http://localhost:3000/sessions/609018e2-6de6-478c-94d1-a0e66829982b/connect" \
  -H "apikey: YOUR_API_KEY"
```

### Obter QR Code

```bash
GET /sessions/:id/qr
```

```bash
curl -X GET "http://localhost:3000/sessions/609018e2-6de6-478c-94d1-a0e66829982b/qr" \
  -H "apikey: YOUR_API_KEY"
```

**Response:**
```json
{
  "qrCode": "2@ExdpBla8fOhEu/deC2uSoO..."
}
```

### Parear com Código

```bash
POST /sessions/:id/pair
```

```bash
curl -X POST "http://localhost:3000/sessions/609018e2-6de6-478c-94d1-a0e66829982b/pair" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5511999999999"
  }'
```

### Status da Sessão

```bash
GET /sessions/:id/status
```

```bash
curl -X GET "http://localhost:3000/sessions/609018e2-6de6-478c-94d1-a0e66829982b/status" \
  -H "apikey: YOUR_API_KEY"
```

**Response:**
```json
{
  "status": "connected"
}
```

### Desconectar Sessão

```bash
POST /sessions/:id/disconnect
```

```bash
curl -X POST "http://localhost:3000/sessions/609018e2-6de6-478c-94d1-a0e66829982b/disconnect" \
  -H "apikey: YOUR_API_KEY"
```

### Logout (Remove Credenciais)

```bash
POST /sessions/:id/logout
```

```bash
curl -X POST "http://localhost:3000/sessions/609018e2-6de6-478c-94d1-a0e66829982b/logout" \
  -H "apikey: YOUR_API_KEY"
```

### Deletar Sessão

```bash
DELETE /sessions/:id/delete
```

```bash
curl -X DELETE "http://localhost:3000/sessions/609018e2-6de6-478c-94d1-a0e66829982b/delete" \
  -H "apikey: YOUR_API_KEY"
```

---

## Chatwoot

### Configurar Chatwoot (Completo)

```bash
POST /sessions/:sessionId/chatwoot/set
```

```bash
curl -X POST "http://localhost:3000/sessions/609018e2-6de6-478c-94d1-a0e66829982b/chatwoot/set" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "url": "https://chatwoot.example.com",
    "accountId": "1",
    "token": "your-chatwoot-api-token",
    "inbox": "WhatsApp Business",
    "signMsg": true,
    "signDelimiter": "\n",
    "reopen": true,
    "pending": false,
    "mergeBrazil": true,
    "importContacts": false,
    "importMessages": false,
    "importDays": 3,
    "organization": "Minha Empresa",
    "logo": "https://example.com/logo.png",
    "ignoreJids": []
  }'
```

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `enabled` | boolean | Sim | Ativa/desativa integração |
| `url` | string | Sim* | URL do Chatwoot |
| `accountId` | string | Sim* | ID da conta Chatwoot |
| `token` | string | Sim* | Token de API do Chatwoot |
| `inbox` | string | Não | Nome da inbox (criada automaticamente) |
| `signMsg` | boolean | Não | Assinar mensagens com nome do remetente (grupos) |
| `signDelimiter` | string | Não | Delimitador entre nome e mensagem (default: `\n`) |
| `reopen` | boolean | Não | Reabrir conversas resolvidas |
| `pending` | boolean | Não | Criar conversas como pendentes |
| `mergeBrazil` | boolean | Não | Merge de números BR (com/sem 9) |
| `importContacts` | boolean | Não | Importar contatos existentes |
| `importMessages` | boolean | Não | Importar histórico de mensagens |
| `importDays` | number | Não | Dias para importar (1-30) |
| `organization` | string | Não | Nome da organização (bot) |
| `logo` | string | Não | URL do logo (bot) |
| `ignoreJids` | string[] | Não | JIDs a ignorar |

*Obrigatório quando `enabled: true`

**Response:**
```json
{
  "id": "cmifzyngx00002qmwq3uhnij6",
  "sessionId": "609018e2-6de6-478c-94d1-a0e66829982b",
  "enabled": true,
  "accountId": "1",
  "token": "************************",
  "url": "https://chatwoot.example.com",
  "inbox": "WhatsApp Business",
  "signMsg": true,
  "signDelimiter": "\n",
  "reopen": true,
  "pending": false,
  "mergeBrazil": true,
  "importContacts": false,
  "importMessages": false,
  "importDays": 3,
  "organization": "Minha Empresa",
  "logo": "https://example.com/logo.png",
  "ignoreJids": [],
  "webhookUrl": "http://YOUR_SERVER/chatwoot/webhook/609018e2-6de6-478c-94d1-a0e66829982b",
  "createdAt": "2025-11-26T12:44:48.051Z",
  "updatedAt": "2025-11-26T12:44:48.051Z"
}
```

### Obter Configuração Chatwoot

```bash
GET /sessions/:sessionId/chatwoot/find
```

```bash
curl -X GET "http://localhost:3000/sessions/609018e2-6de6-478c-94d1-a0e66829982b/chatwoot/find" \
  -H "apikey: YOUR_API_KEY"
```

### Remover Configuração Chatwoot

```bash
DELETE /sessions/:sessionId/chatwoot
```

```bash
curl -X DELETE "http://localhost:3000/sessions/609018e2-6de6-478c-94d1-a0e66829982b/chatwoot" \
  -H "apikey: YOUR_API_KEY"
```

### Webhooks Chatwoot (Públicos)

**Webhook do Chatwoot → Zpwoot:**
```
POST /chatwoot/webhook/:sessionId
```

**Webhook do Zpwoot → Chatwoot:**
```
POST /chatwoot/receive/:sessionId
```

---

## Mensagens

### Enviar Texto

```bash
POST /sessions/:sessionId/messages/text
```

```bash
curl -X POST "http://localhost:3000/sessions/609018e2-6de6-478c-94d1-a0e66829982b/messages/text" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "text": "Olá! Como posso ajudar?"
  }'
```

### Enviar Texto com Menções

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/messages/text" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "120363123456789012@g.us",
    "text": "Olá @user1 e @user2!",
    "mentions": ["5511999999999@s.whatsapp.net", "5511888888888@s.whatsapp.net"]
  }'
```

### Enviar Imagem

```bash
POST /sessions/:sessionId/messages/image
```

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/messages/image" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "url": "https://example.com/image.jpg",
    "caption": "Confira esta imagem!"
  }'
```

### Enviar Vídeo

```bash
POST /sessions/:sessionId/messages/video
```

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/messages/video" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "url": "https://example.com/video.mp4",
    "caption": "Assista ao vídeo!"
  }'
```

### Enviar Áudio/PTT

```bash
POST /sessions/:sessionId/messages/audio
```

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/messages/audio" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "url": "https://example.com/audio.mp3",
    "ptt": true
  }'
```

### Enviar Documento

```bash
POST /sessions/:sessionId/messages/document
```

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/messages/document" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "url": "https://example.com/document.pdf",
    "filename": "relatorio.pdf",
    "caption": "Segue o relatório"
  }'
```

### Enviar Localização

```bash
POST /sessions/:sessionId/messages/location
```

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/messages/location" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "name": "São Paulo",
    "address": "São Paulo, Brasil"
  }'
```

### Enviar Contato

```bash
POST /sessions/:sessionId/messages/contact
```

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/messages/contact" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "contacts": [
      {
        "fullName": "João Silva",
        "phoneNumber": "5511888888888",
        "organization": "Empresa X"
      }
    ]
  }'
```

### Enviar Reação

```bash
POST /sessions/:sessionId/messages/react
```

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/messages/react" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "messageId": "3EB0ABCD123456",
    "emoji": "👍"
  }'
```

### Responder Mensagem (Quote)

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/messages/text" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "text": "Esta é uma resposta!",
    "quoted": {
      "id": "3EB0ABCD123456",
      "remoteJid": "5511999999999@s.whatsapp.net"
    }
  }'
```

### Enviar Enquete

```bash
POST /sessions/:sessionId/messages/poll
```

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/messages/poll" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "name": "Qual sua cor favorita?",
    "options": ["Azul", "Verde", "Vermelho"],
    "selectableCount": 1
  }'
```

### Editar Mensagem

```bash
POST /sessions/:sessionId/messages/edit
```

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/messages/edit" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "messageId": "3EB0ABCD123456",
    "text": "Mensagem editada!"
  }'
```

### Deletar Mensagem

```bash
DELETE /sessions/:sessionId/messages/delete
```

```bash
curl -X DELETE "http://localhost:3000/sessions/{sessionId}/messages/delete" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "messageId": "3EB0ABCD123456"
  }'
```

---

## Grupos

### Listar Grupos

```bash
GET /sessions/:sessionId/groups
```

```bash
curl -X GET "http://localhost:3000/sessions/{sessionId}/groups" \
  -H "apikey: YOUR_API_KEY"
```

### Criar Grupo

```bash
POST /sessions/:sessionId/groups
```

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/groups" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Meu Novo Grupo",
    "participants": ["5511999999999", "5511888888888"]
  }'
```

### Metadados do Grupo

```bash
GET /sessions/:sessionId/groups/:groupId
```

```bash
curl -X GET "http://localhost:3000/sessions/{sessionId}/groups/120363123456789012@g.us" \
  -H "apikey: YOUR_API_KEY"
```

### Adicionar Participantes

```bash
POST /sessions/:sessionId/groups/:groupId/participants
```

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/groups/{groupId}/participants" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "participants": ["5511999999999"]
  }'
```

### Remover Participantes

```bash
DELETE /sessions/:sessionId/groups/:groupId/participants
```

```bash
curl -X DELETE "http://localhost:3000/sessions/{sessionId}/groups/{groupId}/participants" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "participants": ["5511999999999"]
  }'
```

### Promover a Admin

```bash
POST /sessions/:sessionId/groups/:groupId/participants/promote
```

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/groups/{groupId}/participants/promote" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "participants": ["5511999999999"]
  }'
```

---

## Contatos

### Listar Contatos

```bash
GET /sessions/:sessionId/contacts
```

```bash
curl -X GET "http://localhost:3000/sessions/{sessionId}/contacts" \
  -H "apikey: YOUR_API_KEY"
```

### Validar Números no WhatsApp

```bash
POST /sessions/:sessionId/contacts/validate
```

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/contacts/validate" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "numbers": ["5511999999999", "5511888888888"]
  }'
```

---

## Webhooks

### Configurar Webhook

```bash
POST /sessions/:sessionId/webhook/set
```

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/webhook/set" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhook",
    "events": [
      "messages.upsert",
      "messages.update",
      "messages.delete",
      "connection.update",
      "presence.update"
    ]
  }'
```

### Listar Eventos Disponíveis

```bash
GET /webhook/events
```

```bash
curl -X GET "http://localhost:3000/webhook/events" \
  -H "apikey: YOUR_API_KEY"
```

**Eventos Disponíveis:**
- `connection.update`
- `creds.update`
- `messaging-history.set`
- `chats.upsert`
- `chats.update`
- `chats.delete`
- `presence.update`
- `contacts.upsert`
- `contacts.update`
- `messages.upsert`
- `messages.update`
- `messages.delete`
- `messages.reaction`
- `message-receipt.update`
- `groups.upsert`
- `groups.update`
- `group-participants.update`
- `call`

---

## Fluxos Completos

### 1. Criar Sessão + Chatwoot + Conectar (Bot no Chatwoot)

Este fluxo cria uma sessão completa com Chatwoot configurado. O QR Code será enviado automaticamente para o bot no Chatwoot.

```bash
# 1. Criar sessão
SESSION_ID=$(curl -s -X POST "http://localhost:3000/sessions/create" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "WhatsApp Produção"}' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

echo "Session ID: $SESSION_ID"

# 2. Configurar Chatwoot completo
curl -X POST "http://localhost:3000/sessions/$SESSION_ID/chatwoot/set" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "url": "https://chatwoot.example.com",
    "accountId": "1",
    "token": "YOUR_CHATWOOT_TOKEN",
    "inbox": "WhatsApp Produção",
    "signMsg": true,
    "signDelimiter": "\n",
    "reopen": true,
    "pending": false,
    "mergeBrazil": true,
    "organization": "Minha Empresa",
    "logo": "https://example.com/logo.png"
  }'

# 3. Conectar (QR Code será enviado ao Chatwoot)
curl -X POST "http://localhost:3000/sessions/$SESSION_ID/connect" \
  -H "apikey: YOUR_API_KEY"

# 4. Verificar status
curl -X GET "http://localhost:3000/sessions/$SESSION_ID/status" \
  -H "apikey: YOUR_API_KEY"
```

Após executar, vá ao **Chatwoot** e procure a conversa com o contato **"Minha Empresa"** (ou o nome que você definiu em `organization`). O **QR Code** estará lá para você escanear.

### 2. Comandos do Bot no Chatwoot

Após configurar, você pode gerenciar a sessão diretamente pelo Chatwoot enviando comandos para o contato bot (123456):

| Comando | Descrição |
|---------|-----------|
| `/init` | Iniciar conexão / Gerar novo QR Code |
| `/status` | Ver status da conexão |
| `/disconnect` | Desconectar sessão |
| `/help` | Ver comandos disponíveis |

### 3. Sessão Simples (Sem Chatwoot)

```bash
# 1. Criar sessão
curl -X POST "http://localhost:3000/sessions/create" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Sessão Simples"}'

# 2. Conectar
curl -X POST "http://localhost:3000/sessions/{sessionId}/connect" \
  -H "apikey: YOUR_API_KEY"

# 3. Obter QR Code
curl -X GET "http://localhost:3000/sessions/{sessionId}/qr" \
  -H "apikey: YOUR_API_KEY"

# 4. Ou parear com código
curl -X POST "http://localhost:3000/sessions/{sessionId}/pair" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "5511999999999"}'
```

### 4. Trocar de Conta (Logout + Novo QR)

```bash
# 1. Logout (remove credenciais)
curl -X POST "http://localhost:3000/sessions/{sessionId}/logout" \
  -H "apikey: YOUR_API_KEY"

# 2. Conectar novamente (gera novo QR)
curl -X POST "http://localhost:3000/sessions/{sessionId}/connect" \
  -H "apikey: YOUR_API_KEY"

# Se tiver Chatwoot configurado, o novo QR será enviado automaticamente
# Ou envie /init no chat do bot
```

### 5. Enviar Mensagem com Mídia e Reply

```bash
curl -X POST "http://localhost:3000/sessions/{sessionId}/messages/image" \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "url": "https://example.com/product.jpg",
    "caption": "Confira nosso novo produto!",
    "quoted": {
      "id": "3EB0ABCD123456",
      "remoteJid": "5511999999999@s.whatsapp.net"
    }
  }'
```

---

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 204 | Sem conteúdo (deletado) |
| 400 | Requisição inválida |
| 401 | API Key inválida |
| 404 | Não encontrado |
| 500 | Erro interno |

---

## Status da Sessão

| Status | Descrição |
|--------|-----------|
| `disconnected` | Desconectada |
| `connecting` | Conectando (aguardando QR) |
| `connected` | Conectada e pronta |

---

*Última atualização: 2025-11-26*
