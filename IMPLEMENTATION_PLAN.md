# Plano de Implementacao Completa - Whaileys API v6.4.3

## Analise Comparativa: Whaileys vs Nossa API

Baseado na analise do codigo fonte do [whaileys](https://github.com/canove/whaileys) v6.4.3 instalado em `node_modules/whaileys`, aqui esta o mapeamento completo de metodos disponiveis vs implementados.

**Data da Analise:** 2025-11-27
**Versao whaileys:** 6.4.3

---

## 1. SESSIONS (`src/api/sessions/`)

### Implementados ✅
- [x] `createSession` - Criar sessao
- [x] `getAllSessions` - Listar sessoes
- [x] `getSession` - Obter sessao
- [x] `deleteSession` - Deletar sessao
- [x] `connect` - Conectar sessao
- [x] `logout` - Desconectar
- [x] `restart` - Reiniciar
- [x] `getQrCode` - Obter QR code
- [x] `getStatus` - Status da conexao

### Faltando ⚠️
- [ ] `requestPairingCode(phoneNumber, customPairingCode?)` - Conexao via codigo de pareamento (sem QR)

**Cobertura: 90%**

---

## 2. MESSAGES (`src/api/messages/`)

### Implementados ✅
- [x] `sendText` - Enviar texto
- [x] `sendImage` - Enviar imagem
- [x] `sendVideo` - Enviar video
- [x] `sendAudio` - Enviar audio
- [x] `sendDocument` - Enviar documento
- [x] `sendLocation` - Enviar localizacao
- [x] `sendContact` - Enviar contato
- [x] `sendSticker` - Enviar figurinha
- [x] `sendReaction` - Enviar reacao
- [x] `sendButtons` - Enviar botoes
- [x] `sendList` - Enviar lista
- [x] `sendTemplate` - Enviar template
- [x] `forwardMessage` - Encaminhar mensagem
- [x] `deleteMessage` - Deletar mensagem para todos
- [x] `deleteMessageForMe` - Deletar mensagem para mim
- [x] `readMessages` - Marcar como lida

### Faltando ⚠️
- [ ] `sendPoll` - Enviar enquete (via sendMessage com poll content)
- [ ] `updateMediaMessage(message)` - Re-upload de media expirada
- [ ] `editMessage` - Editar mensagem enviada (via sendMessage com edit key)
- [ ] `sendReceipt(jid, participant, messageIds, type)` - Enviar recibo customizado
- [ ] `sendReceipts(keys, type)` - Enviar recibos em lote
- [ ] `fetchMessageHistory(count, oldestMsgKey, timestamp)` - Buscar historico
- [ ] `requestPlaceholderResend(messageKeys)` - Solicitar reenvio de placeholder

**Cobertura: 70%**

---

## 3. GROUPS (`src/api/groups/`)

### Implementados ✅
- [x] `groupCreate` - Criar grupo
- [x] `groupMetadata` - Metadados do grupo
- [x] `groupUpdateSubject` - Atualizar nome
- [x] `groupUpdateDescription` - Atualizar descricao
- [x] `groupParticipantsUpdate` - Add/remove/promote/demote
- [x] `groupSettingUpdate` - Configuracoes (announcement/locked)
- [x] `groupInviteCode` - Obter codigo de convite
- [x] `groupRevokeInvite` - Revogar convite
- [x] `groupGetInviteInfo` - Info pelo codigo
- [x] `groupAcceptInvite` - Entrar no grupo
- [x] `groupLeave` - Sair do grupo
- [x] `updateGroupPicture` - Atualizar foto
- [x] `groupAcceptInviteV4` - Aceitar convite V4
- [x] `groupFetchAllParticipating` - Listar todos os grupos
- [x] `groupToggleEphemeral` - Mensagens temporarias

### Faltando ⚠️
Nenhum metodo principal faltando. O whaileys v6.4.3 nao expoe metodos de aprovacao de membros diretamente.

**Cobertura: 100%**

---

## 4. CHATS (`src/api/chats/`)

### Implementados ✅
- [x] `archiveChat` - Arquivar/desarquivar
- [x] `muteChat` - Silenciar
- [x] `pinChat` - Fixar
- [x] `markChatRead` - Marcar como lido
- [x] `deleteChat` - Deletar chat
- [x] `setDisappearingMessages` - Mensagens temporarias
- [x] `starMessage` - Favoritar mensagem
- [x] `clearMessages` - Limpar mensagens

### Faltando ⚠️
- [ ] `fetchMessages` - Buscar historico de mensagens (requer store)
- [ ] `loadMessage` - Carregar mensagem especifica

**Cobertura: 80%**

---

## 5. CONTACTS (`src/api/contacts/`)

### Implementados ✅
- [x] `block` - Bloquear contato
- [x] `unblock` - Desbloquear contato
- [x] `checkNumber` - Verificar se existe no WhatsApp (`onWhatsApp`)
- [x] `getProfilePicture` - Foto de perfil
- [x] `getStatus` - Status do contato (`fetchStatus`)
- [x] `getBusinessProfile` - Perfil comercial
- [x] `getBroadcastListInfo` - Info de lista de transmissao
- [x] `getBlocklist` - Lista de bloqueados (`fetchBlocklist`)
- [x] `addContact` - Adicionar contato (`addOrEditContact`)
- [x] `removeContact` - Remover contato

### Faltando ⚠️
Nenhum metodo essencial faltando.

**Cobertura: 100%**

---

## 6. PRESENCE (`src/api/presence/`)

### Implementados ✅
- [x] `sendPresenceUpdate` - Enviar status (online/typing/recording)
- [x] `presenceSubscribe` - Assinar atualizacoes de presenca

### Faltando ⚠️
Nenhum metodo essencial faltando.

**Cobertura: 100%**

---

## 7. SETTINGS (`src/api/settings/`)

### Implementados ✅
- [x] `fetchPrivacySettings` - Obter configuracoes de privacidade
- [x] `updateLastSeenPrivacy` - Privacidade visto por ultimo
- [x] `updateOnlinePrivacy` - Privacidade status online
- [x] `updateProfilePicturePrivacy` - Privacidade foto de perfil
- [x] `updateStatusPrivacy` - Privacidade status
- [x] `updateReadReceiptsPrivacy` - Confirmacao de leitura
- [x] `updateGroupsAddPrivacy` - Quem pode adicionar em grupos
- [x] `updateCallPrivacy` - Quem pode ligar
- [x] `updateMessagesPrivacy` - Privacidade de mensagens
- [x] `updateProfileStatus` - Atualizar status
- [x] `updateProfileName` - Atualizar nome
- [x] `updateProfilePicture` - Atualizar foto

### Faltando ⚠️
- [ ] `removeProfilePicture` - Remover foto de perfil (passar null)

**Cobertura: 92%**

---

## 8. BUSINESS (NOVO MODULO SUGERIDO)

O whaileys v6.4.3 expoe os seguintes metodos de business:

### Nao Implementado ❌
- [ ] `getCatalog(jid?, limit?)` - Obter catalogo de produtos
- [ ] `getCollections(jid?, limit?)` - Obter colecoes de produtos
- [ ] `getOrderDetails(orderId, tokenBase64)` - Detalhes de pedido
- [ ] `productCreate(create)` - Criar produto
- [ ] `productUpdate(productId, update)` - Atualizar produto
- [ ] `productDelete(productIds[])` - Deletar produtos

**Cobertura: 0%**

---

## 9. CALLS (NOVO - REJEITAR CHAMADAS)

O whaileys v6.4.3 expoe metodo para rejeitar chamadas:

### Nao Implementado ❌
- [ ] `rejectCall(callId, callFrom)` - Rejeitar chamada recebida

**Cobertura: 0%**

---

## 10. LABELS/TAGS (NAO DISPONIVEL NO WHAILEYS)

O whaileys focou em simplicidade e estabilidade, removendo suporte a labels/tags.

---

## RESUMO GERAL

| Modulo | Implementados | Faltando | Cobertura |
|--------|---------------|----------|-----------|
| Sessions | 9 | 1 | 90% |
| Messages | 16 | 7 | 70% |
| Groups | 15 | 0 | 100% |
| Chats | 8 | 0 | 100% |
| Contacts | 10 | 0 | 100% |
| Presence | 2 | 0 | 100% |
| Settings | 12 | 0 | 100% |
| Business | 0 | 6 | 0% |
| Calls | 0 | 1 | 0% |
| **TOTAL** | **72** | **15** | **83%** |

---

## PLANO DE IMPLEMENTACAO

### Fase 1: Prioridade Alta (Core Features)

#### 1.1 Sessions - Pairing Code
```typescript
// POST /sessions/:name/pairing-code
requestPairingCode(sessionName: string, phoneNumber: string, customCode?: string)
```

#### 1.2 Messages - Novos tipos
```typescript
// POST /sessions/:name/send/poll
sendPoll(sessionName, { to, name, options, selectableCount })

// POST /sessions/:name/send/edit
editMessage(sessionName, { to, messageKey, newText })
```

#### 1.3 Calls - Rejeitar chamadas
```typescript
// POST /sessions/:name/calls/reject
rejectCall(sessionName, { callId, callFrom })
```

### Fase 2: Prioridade Media (Business Features)

#### 2.1 Criar modulo Business
```
src/api/business/
├── dto/
│   ├── business.dto.ts
│   └── index.ts
├── business.module.ts
├── business.service.ts
└── business.controller.ts
```

**Endpoints:**
```typescript
// GET /sessions/:name/business/catalog
getCatalog(sessionName, jid?, limit?)

// GET /sessions/:name/business/collections
getCollections(sessionName, jid?, limit?)

// GET /sessions/:name/business/orders/:orderId
getOrderDetails(sessionName, orderId, tokenBase64)

// POST /sessions/:name/business/products
createProduct(sessionName, productData)

// PUT /sessions/:name/business/products/:productId
updateProduct(sessionName, productId, updates)

// DELETE /sessions/:name/business/products
deleteProducts(sessionName, productIds[])
```

### Fase 3: Prioridade Baixa (Advanced Features)

#### 3.1 Messages - Features avancadas
```typescript
// POST /sessions/:name/messages/update-media
updateMediaMessage(sessionName, messageInfo)

// POST /sessions/:name/messages/receipts
sendReceipt(sessionName, { jid, participant?, messageIds, type })

// POST /sessions/:name/messages/history
fetchMessageHistory(sessionName, { count, oldestMsgKey, timestamp })
```

---

## IMPLEMENTACAO DETALHADA

### 1. requestPairingCode (Sessions) - PRIORIDADE ALTA

```typescript
// src/api/sessions/dto/session.dto.ts
export class PairingCodeRequestDto {
  @ApiProperty({ example: '5511999999999', description: 'Phone number without + or spaces' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'ABC123', description: 'Custom pairing code (optional)' })
  @IsString()
  @IsOptional()
  customCode?: string;
}

export class PairingCodeResponseDto {
  @ApiProperty({ example: 'ABC123' })
  code: string;
}

// src/api/sessions/sessions.controller.ts
@Post(':name/pairing-code')
@ApiOperation({ summary: 'Request pairing code for phone linking (alternative to QR)' })
async requestPairingCode(
  @Param('name') name: string,
  @Body() dto: PairingCodeRequestDto,
): Promise<PairingCodeResponseDto> {
  return this.sessionsService.requestPairingCode(name, dto.phoneNumber, dto.customCode);
}

// src/api/sessions/sessions.service.ts
async requestPairingCode(sessionName: string, phoneNumber: string, customCode?: string) {
  const session = this.whaileysService.getSession(sessionName);
  if (!session?.socket) {
    throw new BadRequestException('Session not initialized. Call /connect first.');
  }
  const code = await session.socket.requestPairingCode(phoneNumber, customCode);
  return { code };
}
```

### 2. sendPoll (Messages) - PRIORIDADE ALTA

```typescript
// src/api/messages/dto/messages.dto.ts
export class SendPollDto {
  @ApiProperty({ example: '5511999999999' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: 'What is your favorite color?' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: ['Red', 'Blue', 'Green'] })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @ApiPropertyOptional({ example: 1, description: 'Number of options user can select' })
  @IsNumber()
  @IsOptional()
  selectableCount?: number;
}

// src/api/messages/messages.service.ts
async sendPoll(sessionName: string, dto: SendPollDto) {
  const session = this.getSessionOrThrow(sessionName);
  const jid = this.formatJid(dto.to);
  return session.socket.sendMessage(jid, {
    poll: {
      name: dto.name,
      values: dto.options,
      selectableCount: dto.selectableCount || 1,
    },
  });
}
```

### 3. editMessage (Messages) - PRIORIDADE ALTA

```typescript
// src/api/messages/dto/messages.dto.ts
export class EditMessageDto {
  @ApiProperty({ example: '5511999999999' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Message key of the message to edit' })
  messageKey: {
    id: string;
    fromMe: boolean;
    remoteJid: string;
  };

  @ApiProperty({ example: 'New edited text' })
  @IsString()
  @IsNotEmpty()
  newText: string;
}

// src/api/messages/messages.service.ts
async editMessage(sessionName: string, dto: EditMessageDto) {
  const session = this.getSessionOrThrow(sessionName);
  const jid = this.formatJid(dto.to);
  return session.socket.sendMessage(jid, {
    text: dto.newText,
    edit: dto.messageKey,
  });
}
```

### 4. rejectCall (Calls) - PRIORIDADE ALTA

```typescript
// src/api/calls/dto/calls.dto.ts
export class RejectCallDto {
  @ApiProperty({ description: 'Call ID from the call event' })
  @IsString()
  @IsNotEmpty()
  callId: string;

  @ApiProperty({ description: 'JID of the caller' })
  @IsString()
  @IsNotEmpty()
  callFrom: string;
}

// src/api/calls/calls.service.ts
async rejectCall(sessionName: string, dto: RejectCallDto) {
  const socket = this.whaileysService.getConnectedSocket(sessionName);
  await socket.rejectCall(dto.callId, dto.callFrom);
}

// src/api/calls/calls.controller.ts
@Post()
@ApiOperation({ summary: 'Reject an incoming call' })
async rejectCall(
  @Param('session') session: string,
  @Body() dto: RejectCallDto,
): Promise<SuccessResponseDto> {
  await this.callsService.rejectCall(session, dto);
  return { success: true };
}
```

### 5. Business Module - PRIORIDADE MEDIA

```typescript
// src/api/business/business.service.ts
@Injectable()
export class BusinessService {
  constructor(private readonly whaileysService: WhaileysService) {}

  async getCatalog(sessionName: string, jid?: string, limit = 10) {
    const socket = this.whaileysService.getConnectedSocket(sessionName);
    return socket.getCatalog(jid, limit);
  }

  async getCollections(sessionName: string, jid?: string, limit = 51) {
    const socket = this.whaileysService.getConnectedSocket(sessionName);
    return socket.getCollections(jid, limit);
  }

  async getOrderDetails(sessionName: string, orderId: string, tokenBase64: string) {
    const socket = this.whaileysService.getConnectedSocket(sessionName);
    return socket.getOrderDetails(orderId, tokenBase64);
  }

  async createProduct(sessionName: string, product: ProductCreate) {
    const socket = this.whaileysService.getConnectedSocket(sessionName);
    return socket.productCreate(product);
  }

  async updateProduct(sessionName: string, productId: string, update: ProductUpdate) {
    const socket = this.whaileysService.getConnectedSocket(sessionName);
    return socket.productUpdate(productId, update);
  }

  async deleteProducts(sessionName: string, productIds: string[]) {
    const socket = this.whaileysService.getConnectedSocket(sessionName);
    return socket.productDelete(productIds);
  }
}
```

---

## ORDEM DE IMPLEMENTACAO RECOMENDADA

### Sprint 1 (Alta Prioridade)
1. **requestPairingCode** - Alternativa ao QR code, muito solicitado
2. **sendPoll** - Feature popular do WhatsApp
3. **editMessage** - Edicao de mensagens enviadas
4. **rejectCall** - Rejeitar chamadas automaticamente

### Sprint 2 (Media Prioridade)
5. **Business Module** - Catalogo e produtos para contas comerciais
   - getCatalog
   - getCollections
   - getOrderDetails
   - productCreate/Update/Delete

### Sprint 3 (Baixa Prioridade)
6. **updateMediaMessage** - Re-upload de media expirada
7. **fetchMessageHistory** - Historico de mensagens
8. **sendReceipt/sendReceipts** - Recibos customizados

---

## EVENTOS WEBHOOK

### Implementados ✅
- `messages.upsert`
- `messages.update`
- `messages.reaction`
- `message-receipt.update`
- `chats.upsert`
- `chats.update`
- `chats.delete`
- `contacts.upsert`
- `contacts.update`
- `groups.upsert`
- `groups.update`
- `group-participants.update`
- `presence.update`
- `connection.update`
- `call`

### A Verificar ⚠️
- `blocklist.set` - Quando blocklist e definida
- `blocklist.update` - Quando usuario e bloqueado/desbloqueado
- `messages.media-update` - Quando media e atualizada
- `messages.delete` - Quando mensagens sao deletadas

---

## ESTIMATIVA DE TEMPO

| Item | Complexidade | Tempo Estimado |
|------|--------------|----------------|
| requestPairingCode | Baixa | 1h |
| sendPoll | Baixa | 1h |
| editMessage | Baixa | 1h |
| rejectCall + Calls Module | Media | 2h |
| Business Module Completo | Alta | 4h |
| updateMediaMessage | Media | 2h |
| fetchMessageHistory | Media | 2h |
| sendReceipt/sendReceipts | Baixa | 1h |
| **TOTAL** | | **14h** |
