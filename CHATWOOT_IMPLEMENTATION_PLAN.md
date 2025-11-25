# Plano de Implementação - Integração Chatwoot

## Análise da Evolution API

A Evolution API possui uma implementação robusta de integração com Chatwoot (~2600 linhas). Os principais componentes são:

### Dependências Necessárias
```bash
npm install @figuro/chatwoot-sdk form-data mime-types jimp
```

### Estrutura de Arquivos (Evolution API)
```
src/api/integrations/chatbot/chatwoot/
├── controllers/
│   └── chatwoot.controller.ts    # Endpoints da API
├── dto/
│   └── chatwoot.dto.ts           # DTOs de configuração
├── libs/
│   └── postgres.client.ts        # Cliente PostgreSQL (para import histórico)
├── routes/
│   └── chatwoot.router.ts        # Rotas Express
├── services/
│   └── chatwoot.service.ts       # Lógica principal (~2600 linhas)
├── utils/
│   └── chatwoot-import-helper.ts # Helper para importação
└── validate/
    └── chatwoot.schema.ts        # Validação de schemas
```

---

## Plano de Implementação para Zpwoot

### Phase 1: Setup (Infraestrutura)

#### 1.1 Instalar dependências
```bash
npm install @figuro/chatwoot-sdk form-data mime-types
```

#### 1.2 Schema Prisma - Adicionar modelo Chatwoot
```prisma
model Chatwoot {
  id                      String   @id @default(cuid())
  sessionId               String   @unique
  session                 Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
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
  organization            String?
  logo                    String?
  ignoreJids              String[] @default([])
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
}
```

#### 1.3 Variáveis de ambiente (.env)
```env
# Chatwoot Integration
CHATWOOT_ENABLED=true
CHATWOOT_MESSAGE_DELETE=true
CHATWOOT_BOT_CONTACT=true
CHATWOOT_IMPORT_DATABASE_URI=
```

---

### Phase 2: Estrutura do Módulo

#### 2.1 Estrutura de diretórios
```
src/integrations/chatwoot/
├── dto/
│   ├── chatwoot.dto.ts
│   └── chatwoot-webhook.dto.ts
├── chatwoot.controller.ts
├── chatwoot.service.ts
├── chatwoot.repository.ts
└── chatwoot.module.ts
```

#### 2.2 ChatwootDto
```typescript
export class ChatwootDto {
  enabled?: boolean;
  accountId?: string;
  token?: string;
  url?: string;
  nameInbox?: string;
  signMsg?: boolean;
  signDelimiter?: string;
  reopenConversation?: boolean;
  conversationPending?: boolean;
  mergeBrazilContacts?: boolean;
  importContacts?: boolean;
  importMessages?: boolean;
  daysLimitImportMessages?: number;
  organization?: string;
  logo?: string;
  ignoreJids?: string[];
}
```

---

### Phase 3: Core Service

#### 3.1 Funcionalidades principais do ChatwootService

| Método | Descrição |
|--------|-----------|
| `create(sessionId, dto)` | Configura integração Chatwoot |
| `find(sessionId)` | Busca configuração |
| `getClient(sessionId)` | Retorna cliente Chatwoot SDK |
| `findContact(phoneNumber)` | Busca contato no Chatwoot |
| `createContact(phoneNumber, name, avatar)` | Cria contato |
| `updateContact(id, data)` | Atualiza contato |
| `createConversation(sessionId, body)` | Cria/busca conversa |
| `createMessage(conversationId, content, type)` | Cria mensagem |
| `sendMedia(conversationId, file, type)` | Envia mídia |

#### 3.2 Fluxo WhatsApp → Chatwoot
```
1. WhatsApp recebe mensagem (messages.upsert)
2. ChatwootService.eventWhatsapp('messages.upsert', body)
3. Busca/cria contato no Chatwoot
4. Busca/cria conversa no Chatwoot
5. Cria mensagem na conversa
6. Se mídia: faz download e anexa
```

#### 3.3 Fluxo Chatwoot → WhatsApp
```
1. Chatwoot envia webhook para /chatwoot/webhook/:sessionId
2. ChatwootService.receiveWebhook(sessionId, body)
3. Extrai chatId do contato
4. Envia mensagem via WhatsAppService
5. Se mídia: faz download e envia
```

---

### Phase 4: Event Handlers

#### 4.1 Eventos a implementar

| Evento WhatsApp | Ação Chatwoot |
|-----------------|---------------|
| `messages.upsert` | Criar mensagem incoming/outgoing |
| `messages.delete` | Deletar mensagem |
| `messages.edit` | Criar mensagem com "Editado:" |
| `messages.read` | Marcar como lido |
| `connection.update` | Notificar status |
| `qrcode.updated` | Enviar QR code |

#### 4.2 Tipos de mensagem suportados
- Texto simples
- Imagens
- Áudio/Voice
- Vídeos
- Documentos
- Stickers
- Contatos (vCard)
- Localização
- Mensagens de grupo (com identificação do participante)

---

### Phase 5: Webhook Receiver

#### 5.1 Endpoint
```
POST /chatwoot/webhook/:sessionId
```

#### 5.2 Eventos do Chatwoot
- `message_created` - Nova mensagem do agente
- `message_updated` - Mensagem atualizada
- `conversation_status_changed` - Status alterado

#### 5.3 Processamento
```typescript
async receiveWebhook(sessionId: string, body: any) {
  // Ignorar mensagens do bot
  if (body.private || body.message_type !== 'outgoing') return;
  
  // Extrair chatId do contato
  const chatId = body.conversation.meta.sender.identifier;
  
  // Verificar se tem anexos
  if (body.attachments?.length > 0) {
    // Enviar mídia
  } else {
    // Enviar texto
  }
}
```

---

### Phase 6: Controller & Routes

#### 6.1 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/session/:sessionId/chatwoot/set` | Configurar Chatwoot |
| GET | `/session/:sessionId/chatwoot/find` | Buscar configuração |
| POST | `/chatwoot/webhook/:sessionId` | Receber webhook (público) |

---

### Phase 7: Integração

#### 7.1 Registrar no WhatsAppService
```typescript
// Em registerWebhookListeners ou similar
if (chatwootEnabled) {
  socket.ev.on('messages.upsert', (payload) => {
    this.chatwootService.eventWhatsapp('messages.upsert', sessionId, payload);
  });
  // ... outros eventos
}
```

---

### Phase 8: Testes

#### 8.1 Checklist de testes
- [ ] Configurar integração via API
- [ ] Receber mensagem texto no Chatwoot
- [ ] Receber mensagem com imagem no Chatwoot
- [ ] Enviar mensagem do Chatwoot para WhatsApp
- [ ] Enviar mídia do Chatwoot para WhatsApp
- [ ] Mensagens de grupo aparecem com identificação
- [ ] QR code aparece no Chatwoot
- [ ] Status de conexão aparece no Chatwoot

---

## Estimativa de Esforço

| Phase | Esforço |
|-------|---------|
| Phase 1: Setup | 30 min |
| Phase 2: Estrutura | 30 min |
| Phase 3: Core Service | 3-4 horas |
| Phase 4: Event Handlers | 2-3 horas |
| Phase 5: Webhook Receiver | 1-2 horas |
| Phase 6: Controller | 30 min |
| Phase 7: Integração | 1 hora |
| Phase 8: Testes | 1-2 horas |
| **Total** | **~10-12 horas** |

---

## Referências

- [Evolution API - Chatwoot Service](https://github.com/EvolutionAPI/evolution-api/blob/main/src/api/integrations/chatbot/chatwoot/services/chatwoot.service.ts)
- [Chatwoot SDK](https://github.com/nicefirework/chatwoot-sdk)
- [Chatwoot API Docs](https://www.chatwoot.com/developers/api/)
