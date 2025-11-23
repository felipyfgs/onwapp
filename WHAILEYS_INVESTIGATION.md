# INVESTIGAÇÃO COMPLETA DA BIBLIOTECA WHAILEYS

## RESUMO EXECUTIVO

A biblioteca `whaileys` (fork estável do Baileys) fornece 31 eventos distintos para sincronização com WhatsApp Web. O projeto zpwoot está capturando apenas 10 desses eventos completamente. **O evento crítico faltando é `messaging-history.set` que sincroniza histórico completo de mensagens, chats e contatos.**

---

## 1. LISTA COMPLETA DE EVENTOS DISPONÍVEIS (31 eventos)

### EVENTOS DE CONEXÃO (2)
| Evento | Tipo de Payload | Descrição |
|--------|-----------------|-----------|
| `connection.update` | `Partial<ConnectionState>` | Estado da conexão WebSocket |
| `creds.update` | `Partial<AuthenticationCreds>` | Credenciais e estado da autenticação |

### EVENTOS DE MENSAGENS (7)
| Evento | Tipo de Payload | Descrição |
|--------|-----------------|-----------|
| `messages.upsert` | `{ messages: WAMessage[]; type: "append" \| "notify" }` | Novas mensagens recebidas |
| `messages.update` | `WAMessageUpdate[]` | Atualizações de status de mensagens |
| `messages.delete` | `{ keys: WAMessageKey[] } \| { jid: string; all: true }` | Mensagens deletadas |
| `messages.media-update` | `{ key, media?, error? }[]` | Atualização de mídia em mensagens |
| `messages.reaction` | `{ key: WAMessageKey; reaction: proto.IReaction }[]` | Reações a mensagens |
| `messages.pdo-response` | `{ messages: WAMessage[] }` | Resposta de PDO (Peer Data Operation) |
| `message-receipt.update` | `MessageUserReceiptUpdate[]` | Confirmação de leitura/entrega |

### EVENTOS DE CHATS (4)
| Evento | Tipo de Payload | Descrição |
|--------|-----------------|-----------|
| `chats.upsert` | `Chat[]` | Novos chats ou atualização global |
| `chats.update` | `ChatUpdate[]` | Atualizações parciais de chats |
| `chats.delete` | `string[]` | Chats deletados (array de JIDs) |
| `chats.phoneNumberShare` | `{ lid: string; jid: string }` | Compartilhamento de número de telefone |

### EVENTOS DE CONTATOS (3)
| Evento | Tipo de Payload | Descrição |
|--------|-----------------|-----------|
| `contacts.upsert` | `Contact[]` | Novos contatos ou atualizações |
| `contacts.update` | `Partial<Contact>[]` | Atualizações parciais de contatos |
| `contacts.phone-number-share` | `{ lid: string; jid: string }` | Compartilhamento de número |

### EVENTOS DE GRUPOS (2)
| Evento | Tipo de Payload | Descrição |
|--------|-----------------|-----------|
| `groups.upsert` | `GroupMetadata[]` | Novos grupos ou atualizações |
| `groups.update` | `Partial<GroupMetadata>[]` | Atualizações parciais de grupos |
| `group-participants.update` | `{ id: string; participants: string[]; action: ParticipantAction }` | Mudanças em participantes |

### EVENTOS DE PRESENÇA (1)
| Evento | Tipo de Payload | Descrição |
|--------|-----------------|-----------|
| `presence.update` | `{ id: string; presences: {...} }` | Status de digitação/disponibilidade |

### EVENTOS DE HISTÓRICO (1) **CRÍTICO**
| Evento | Tipo de Payload | Descrição |
|--------|-----------------|-----------|
| `messaging-history.set` | `{ chats, contacts, messages, isLatest, progress?, syncType? }` | **SINCRONIZAÇÃO COMPLETA** de histórico |

### EVENTOS DE BLOQUEIO (2)
| Evento | Tipo de Payload | Descrição |
|--------|-----------------|-----------|
| `blocklist.set` | `{ blocklist: string[] }` | Lista de contatos bloqueados |
| `blocklist.update` | `{ blocklist: string[]; type: "add" \| "remove" }` | Atualização de bloqueio |

### EVENTOS DE CHAMADAS (1)
| Evento | Tipo de Payload | Descrição |
|--------|-----------------|-----------|
| `call` | `WACallEvent[]` | Chamadas recebidas/iniciadas |

---

## 2. ESTRUTURA DETALHADA DOS EVENTOS

### 2.1 messaging-history.set (HISTÓRICO COMPLETO)

**Localização no código:** `/root/zpwoot/node_modules/whaileys/lib/Utils/process-message.js:123-130`

**Quando é emitido:** Quando a aplicação recebe um `HISTORY_SYNC_NOTIFICATION` (protocolo WhatsApp)

**Estrutura do payload:**
```typescript
{
  chats: Chat[];                              // Lista de chats sincronizados
  contacts: Contact[];                        // Contatos sincronizados
  messages: WAMessage[];                      // Mensagens do histórico
  isLatest: boolean;                          // Se é a sincronização mais recente
  progress?: number | null;                   // Progresso em % (0-100)
  syncType?: proto.HistorySync.HistorySyncType;
}
```

**Tipos de sincronização (syncType):**
```typescript
enum HistorySyncType {
  INITIAL_BOOTSTRAP = 0,    // Primeira sincronização (pode incluir todo histórico)
  RECENT = 1,               // Sincronização de mensagens recentes
  FULL = 2,                 // Histórico completo solicitado
  ON_DEMAND = 3,            // Sincronização sob demanda (ex: ao scrollar)
  PUSH_NAME = 4             // Apenas atualização de nomes
}
```

**Importante:**
- Este é o ÚNICO evento que traz múltiplos tipos de dados em uma única emissão
- As mensagens vêm em ordem **reverse-chronologically** (mais recentes primeiro)
- Este evento é disparado ANTES dos eventos individuais (chats.upsert, contacts.upsert, messages.upsert)

---

### 2.2 Contact (tipo completo)

**Localização:** `/root/zpwoot/node_modules/whaileys/lib/Types/Contact.d.ts`

```typescript
interface Contact {
  id: string;                           // JID (ex: "5511999999999@c.us")
  lid?: string;                         // Logical ID
  name?: string;                        // Nome salvo na sua agenda
  notify?: string;                      // Nome exibido do contato
  verifiedName?: string;                // Nome verificado (Business)
  imgUrl?: string | null | "changed";   // URL da foto de perfil
                                        // "changed" = foto foi atualizada
  status?: string;                      // Mensagem de status do contato
}
```

---

### 2.3 Chat (tipo completo)

**Localização:** `/root/zpwoot/node_modules/whaileys/lib/Types/Chat.d.ts`

```typescript
type Chat = proto.IConversation & {
  id?: string;                          // JID da conversa
  name?: string;                        // Nome do chat/grupo
  unreadCount?: number;                 // Mensagens não lidas
  readOnly?: boolean;                   // Chat é somente leitura
  archived?: boolean;                   // Se está arquivado
  pinned?: boolean;                     // Se está fixado
  conversationTimestamp?: number;       // Timestamp da última atividade
  ephemeralExpiration?: number | null;  // Duração de mensagens temporárias (0 = desativo)
  lastMessageRecvTimestamp?: number;    // Timestamp da última msg recebida da outra pessoa
  
  mute?: {
    endTimestamp: number;               // Quando o mute expira (0 = unmuted)
  };
}
```

---

### 2.4 WAMessage (tipo completo)

**Localização:** `/root/zpwoot/node_modules/whaileys/lib/Types/Message.d.ts`

```typescript
type WAMessage = proto.IWebMessageInfo & {
  key: WAMessageKey;
  category?: string;
  retryCount?: number;
}

type WAMessageKey = {
  remoteJid: string;                    // JID do destinatário/grupo
  fromMe: boolean;                      // Se foi enviada por este cliente
  id: string;                           // ID único da mensagem
  participant?: string;                 // Participante (grupos)
  senderLid?: string;
  senderPn?: string;
  participantLid?: string;
  participantPn?: string;
  recipientLid?: string;
  isViewOnce?: boolean;
}

// Também contém campos de proto.IWebMessageInfo:
{
  message?: proto.IMessage;             // Conteúdo da mensagem
  messageTimestamp?: number;
  messageStubType?: number;
  status?: number;                      // 0-4: pending, sent, delivered, read, failed
  pushName?: string;                    // Nome do remetente
  broadcast?: boolean;
  // ... e muitos outros campos
}
```

---

## 3. SINCRONIZAÇÃO DO APPSTATE E EVENTOS DERIVADOS

**Localização:** `/root/zpwoot/node_modules/whaileys/lib/Socket/chats.js:313-400`

Os eventos abaixo são emitidos quando o servidor envia mudanças de AppState (sincronização de configurações):

### Via `processSyncAction()` (lib/Utils/chat-utils.js:529-670):

```typescript
// Ações que geram eventos:

// 1. Ação de mute
if (action?.muteAction) {
  ev.emit("chats.update", [{
    id,
    muteEndTime: action.muteAction.muted ? muteEndTimestamp : null
  }])
}

// 2. Arquivo/desarquivo
if (action?.archiveChatAction) {
  ev.emit("chats.update", [{
    id,
    archived: action.archiveChatAction.archived
  }])
}

// 3. Marcar como lido
if (action?.markChatAsReadAction) {
  ev.emit("chats.update", [{
    id,
    unreadCount: 0
  }])
}

// 4. Contato (novo/atualizado)
if (action?.contactAction) {
  ev.emit("contacts.upsert", [{
    id,
    name: action.contactAction.fullName
  }])
}

// 5. Deletar mensagem
if (action?.deleteMessageForMeAction) {
  ev.emit("messages.delete", {
    keys: [messageKey]
  })
}

// 6. Estrelar mensagem
if (action?.starAction) {
  ev.emit("messages.update", [{
    key: messageKey,
    update: { starred: action.starAction.starred }
  }])
}

// 7. Deletar chat
if (action?.deleteChatAction) {
  ev.emit("chats.delete", [id])
}

// 8. Nome push (próprio nome)
if (action?.pushNameSetting) {
  ev.emit("creds.update", {
    me: { ...me, name: action.pushNameSetting.name }
  })
}

// 9. Configuração desarchive
if (action?.unarchiveChatsSetting) {
  ev.emit("creds.update", {
    accountSettings: { unarchiveChats: value }
  })
}
```

---

## 4. EVENTOS CAPTURADOS vs NÃO CAPTURADOS NO ZPWOOT

### ✓ CAPTURADOS COMPLETAMENTE (10)
- `connection.update` (parcialmente - apenas estrutura de status)
- `creds.update` (parcialmente - apenas salvar credenciais)
- `messages.upsert` ✓ → persistência implementada
- `messages.update` ✓ → atualizar status
- `messages.delete` ✓ → marcar como deletado
- `message-receipt.update` ✓ → atualizar status
- `chats.upsert` ✓ → persistência implementada
- `chats.update` ✓ → atualizar chat
- `contacts.upsert` ✓ → persistência implementada
- `contacts.update` ✓ → atualizar contato

### ⚠️ CAPTURADOS PARCIALMENTE (5)
- `presence.update` - apenas logging
- `chats.delete` - apenas logging
- `groups.upsert` - apenas logging
- `groups.update` - apenas logging
- `call` - apenas logging

### ✗ NÃO CAPTURADOS (16)

**CRÍTICOS para sincronização de histórico:**
- `messaging-history.set` ⭐ **FALTANDO** - sincronização inicial/completa de chats, contatos e mensagens

**Importância ALTA (deveria processar):**
- `messages.media-update` - atualizar URLs de mídia
- `messages.reaction` - reações a mensagens
- `group-participants.update` - mudanças em participantes
- `blocklist.set` / `blocklist.update` - gerenciar bloqueios

**Importância MÉDIA:**
- `chats.phoneNumberShare` - compartilhamento de números
- `contacts.phone-number-share` - compartilhamento de números
- `messages.pdo-response` - resposta de operações peer-to-peer

---

## 5. COMO PROCESSAR messaging-history.set

### Fluxo de recebimento:

1. **WhatsApp Web envia HISTORY_SYNC_NOTIFICATION**
   - Protocolo: proto.Message.ProtocolMessage
   - Tipo: HISTORY_SYNC_NOTIFICATION

2. **whaileys processa em process-message.js:103-131**
   ```javascript
   const histNotification = protocolMsg.historySyncNotification;
   
   // Marca como processado
   if (shouldProcessHistoryMsg) {
     ev.emit("creds.update", {
       processedHistoryMessages: [...]  // Registra que foi processada
     });
     
     // Download e decodifica o payload
     const data = await downloadAndProcessHistorySyncNotification(histNotification);
     
     // Emite o evento com todos os dados
     ev.emit("messaging-history.set", {
       ...data,
       isLatest: syncType !== ON_DEMAND
     });
   }
   ```

3. **Dados retornados em `data`:**
   ```typescript
   {
     chats: Chat[];        // Lista de chats do histórico
     contacts: Contact[];  // Contatos sincronizados
     messages: WAMessage[]; // Mensagens em reverse-chronological order
     syncType: HistorySyncType;
     progress: number | null; // % de progresso
   }
   ```

4. **Processamento esperado:**
   - Armazenar todos os chats em batch
   - Armazenar todos os contatos em batch
   - Armazenar todas as mensagens em batch
   - Marcar como "sincronizado" no banco de dados
   - Emitir webhook se configurado

---

## 6. CAMPOS IMPORTANTES QUE FALTAM SER PERSISTIDOS

### Chat fields ainda não capturados:
```typescript
{
  archived?: boolean;           // Campo importante - está arquivado?
  pinned?: boolean;             // Está fixado no topo?
  readOnly?: boolean;           // Chat é somente leitura?
  ephemeralExpiration?: number; // Duração de msgs temporárias
  mute?: {
    endTimestamp: number;       // Quando tira o mute
  };
}
```

### Contact fields ainda não capturados:
```typescript
{
  lid?: string;                 // Logical ID (importante para sync)
  verifiedName?: string;        // Nome verificado (Business accounts)
  status?: string;              // Status do contato
  imgUrl: "changed";            // Flag de mudança de foto
}
```

### Message fields ainda não capturados:
```typescript
{
  messageStubType?: number;     // Tipo de stub (grupo updates, etc)
  status?: number;              // 0-4: pending, sent, delivered, read, failed
  broadcast?: boolean;          // Mensagem broadcast
  category?: string;            // Categoria da mensagem
  retryCount?: number;          // Contagem de retry
}
```

---

## 7. TIPOS DE SINCRONIZAÇÃO (syncType)

### INITIAL_BOOTSTRAP (tipo 0)
- **Quando:** Na primeira conexão ou sincronização forçada
- **Dados:** Pode incluir todo o histórico (customizável)
- **Múltiplas emissões:** Sim, pode vir em chunks com `progress`
- **Usar para:** Sincronização inicial completa do banco de dados

### RECENT (tipo 1)
- **Quando:** Atualizações incrementais (mensagens novas, chats atualizados)
- **Dados:** Apenas mudanças recentes
- **Frequency:** Frequente durante operação normal

### FULL (tipo 2)
- **Quando:** Sincronização completa solicitada pelo usuário
- **Dados:** Histórico completo
- **Chunks:** Pode vir fragmentado com `progress`

### ON_DEMAND (tipo 3)
- **Quando:** Usuário scrollando para cima em histórico
- **Dados:** Mensagens antigas sob demanda
- **isLatest:** SEMPRE false para este tipo

### PUSH_NAME (tipo 4)
- **Quando:** Nomes de contatos atualizados
- **Dados:** Apenas contatos

---

## 8. ESTRUTURA INTERNA DE BUFFERING

whaileys usa um sistema de eventos em buffer para evitar condições de corrida:

```typescript
BufferedEventData {
  historySets: {
    chats: { [jid: string]: Chat };
    contacts: { [jid: string]: Contact };
    messages: { [uqId: string]: WAMessage };
    empty: boolean;
    isLatest: boolean;
  };
  chatUpserts: { [jid: string]: Chat };
  chatUpdates: { [jid: string]: ChatUpdate };
  chatDeletes: Set<string>;
  contactUpserts: { [jid: string]: Contact };
  contactUpdates: { [jid: string]: Partial<Contact> };
  messageUpserts: {
    [key: string]: {
      type: MessageUpsertType;
      message: WAMessage;
    };
  };
  messageUpdates: { [key: string]: WAMessageUpdate };
  messageDeletes: { [key: string]: WAMessageKey };
  // ... mais campos
}
```

Os eventos são coalesced para evitar múltiplas emissões do mesmo evento.

---

## 9. COMPARAÇÃO: messaging-history.set vs chats.upsert/contacts.upsert

| Aspecto | messaging-history.set | chats.upsert | contacts.upsert |
|---------|------------------------|--------------|-----------------|
| **Emissão** | Uma vez (ou múltiplas para chunks) | Contínua | Contínua |
| **Dados** | chats + contacts + messages em um evento | Apenas chats | Apenas contatos |
| **Propósito** | Sincronização histórica inicial | Atualizações incrementais | Atualizações incrementais |
| **Ordem** | Reverse-chronological | N/A | N/A |
| **Chunks** | Pode ter progress | Um por emissão | Um por emissão |
| **Trigger** | HISTORY_SYNC_NOTIFICATION | Mensagem recebida, AppState sync | AppState sync, contactAction |

**NÃO EXISTE "chats.set" ou "contacts.set"** - o equivalente é `messaging-history.set`

---

## 10. RECOMENDAÇÕES DE IMPLEMENTAÇÃO

### Prioridade 1 - CRÍTICO:
1. **Implementar handler para `messaging-history.set`**
   - Persistir chats, contacts, messages em batch
   - Usar transação para manter consistência
   - Rastrear `isLatest` e `syncType`
   - Implementar lógica de chunking com progress

### Prioridade 2 - ALTA:
2. Implementar `messages.media-update` (atualizar URLs)
3. Implementar `messages.reaction` (reações)
4. Implementar `group-participants.update` (mudanças de grupo)
5. Estender `chats.update` para capturar `archived`, `pinned`, `mute`
6. Estender `contacts.update` para capturar `lid`, `verifiedName`, `status`

### Prioridade 3 - MÉDIA:
7. Implementar `blocklist.set` / `blocklist.update`
8. Implementar webhook completo para todos os eventos
9. Melhorar logging de `connection.update` (capturar `isOnline`, `receivedPendingNotifications`)
10. Capturar `call` events com detalhes

---

## 11. ARQUIVO DE REFERÊNCIA RÁPIDA

```
Arquivo de Type Definitions:
/root/zpwoot/node_modules/whaileys/lib/Types/Events.d.ts (linhas 10-99)

Arquivo de Implementação:
/root/zpwoot/node_modules/whaileys/lib/Socket/chats.js (sincronização AppState)
/root/zpwoot/node_modules/whaileys/lib/Socket/messages-recv.js (recebimento de mensagens)
/root/zpwoot/node_modules/whaileys/lib/Utils/process-message.js (processamento de mensagens)
/root/zpwoot/node_modules/whaileys/lib/Utils/chat-utils.js (processSyncAction - linha 529)

Documentação:
/root/zpwoot/node_modules/whaileys/README.md
```

---

## 12. RESUMO FINAL

| Métrica | Quantidade |
|---------|-----------|
| **Total de eventos** | 31 |
| **Totalmente capturados** | 10 |
| **Parcialmente capturados** | 5 |
| **Não capturados** | 16 |
| **Taxa de cobertura** | 48% (10/31) |
| **CRÍTICO faltando** | 1 (messaging-history.set) |
| **Campos adicionais não persistidos** | ~15+ |

**O projeto está capturando a maior parte dos eventos regulares, mas está FALTANDO a sincronização inicial de histórico completo (`messaging-history.set`) que é fundamental para uma experiência de usuário completa.**

