# Plano: Implementação Completa de Tipos de Mensagens Whaileys

## Objetivo
Implementar todos os tipos de mensagens faltantes do Whaileys e corrigir problemas na implementação atual, focando exclusivamente em envio de mensagens.

## Análise da Situação Atual

### Tipos Já Implementados (11)
✅ Text, Image, Video, Audio, Document, Sticker, Contact, Location, Reaction, Delete, Disappearing

### Tipos Faltantes (8)
❌ Buttons, Template Buttons, List, Poll, Interactive, Edit, Forward (funcional), Live Location

### Problemas Identificados
1. `footer` em `SendTextMessageDto` (não pertence a text simples)
2. `forwardMessage()` apenas lança exceção (não implementado)
3. Falta documentação sobre ViewOnce

---

## Novos Tipos de Mensagem a Implementar

### 1. Buttons Message
**Rota**: `POST /messages/:sessionId/buttons`

**DTO**: `src/messages/dto/send-buttons-message.dto.ts`
```typescript
{
  to: string,
  text: string,
  footer?: string,
  buttons: [
    { buttonId: string, buttonText: { displayText: string }, type: 1 }
  ],
  headerType?: number,  // 1 = text, 4 = image
  image?: string,       // Se headerType = 4
  quoted?, ephemeralExpiration?, statusJidList?
}
```

**Content para Whaileys**:
```typescript
{
  text: dto.text,
  footer: dto.footer,
  buttons: dto.buttons,
  headerType: dto.headerType || 1,
  image: dto.image ? parseMediaUpload(dto.image) : undefined
}
```

---

### 2. Template Buttons Message
**Rota**: `POST /messages/:sessionId/template`

**DTO**: `src/messages/dto/send-template-message.dto.ts`
```typescript
{
  to: string,
  text: string,
  footer?: string,
  templateButtons: [
    { index: number, urlButton?: {...}, callButton?: {...}, quickReplyButton?: {...} }
  ],
  image?: string,
  quoted?, ephemeralExpiration?, statusJidList?
}
```

**Sub-DTOs**:
- `UrlButtonDto`: `{ displayText: string, url: string }`
- `CallButtonDto`: `{ displayText: string, phoneNumber: string }`
- `QuickReplyButtonDto`: `{ displayText: string, id: string }`
- `TemplateButtonDto`: `{ index: number, urlButton?, callButton?, quickReplyButton? }`

**Content para Whaileys**:
```typescript
{
  text: dto.text,
  footer: dto.footer,
  templateButtons: dto.templateButtons,
  image: dto.image ? parseMediaUpload(dto.image) : undefined
}
```

---

### 3. List Message
**Rota**: `POST /messages/:sessionId/list`

**DTO**: `src/messages/dto/send-list-message.dto.ts`
```typescript
{
  to: string,
  text: string,
  footer?: string,
  title?: string,
  buttonText: string,  // OBRIGATÓRIO - texto do botão para abrir lista
  sections: [
    {
      title: string,
      rows: [
        { title: string, rowId: string, description?: string }
      ]
    }
  ],
  quoted?, ephemeralExpiration?, statusJidList?
}
```

**Sub-DTOs**:
- `ListRowDto`: `{ title: string, rowId: string, description?: string }`
- `ListSectionDto`: `{ title: string, rows: ListRowDto[] }`

**Content para Whaileys**:
```typescript
{
  text: dto.text,
  footer: dto.footer,
  title: dto.title,
  buttonText: dto.buttonText,
  sections: dto.sections
}
```

---

### 4. Poll Message
**Rota**: `POST /messages/:sessionId/poll`

**DTO**: `src/messages/dto/send-poll-message.dto.ts`
```typescript
{
  to: string,
  name: string,  // Pergunta da enquete
  options: string[],  // Array de opções
  selectableCount?: number,  // 1 = escolha única, 0 = múltipla escolha, padrão: 1
  quoted?, ephemeralExpiration?, statusJidList?
}
```

**Content para Whaileys**:
```typescript
{
  poll: {
    name: dto.name,
    values: dto.options,
    selectableCount: dto.selectableCount || 1
  }
}
```

---

### 5. Interactive Message
**Rota**: `POST /messages/:sessionId/interactive`

**DTO**: `src/messages/dto/send-interactive-message.dto.ts`
```typescript
{
  to: string,
  interactiveMessage: object,  // proto.Message.IInteractiveMessage
  viewOnce?: boolean,
  quoted?, ephemeralExpiration?, statusJidList?
}
```

**Content para Whaileys**:
```typescript
{
  interactiveMessage: dto.interactiveMessage,
  viewOnce: dto.viewOnce
}
```

**Nota**: Tipo avançado, permitir passar objeto bruto do proto

---

### 6. Edit Message
**Rota**: `POST /messages/:sessionId/edit`

**DTO**: `src/messages/dto/edit-message.dto.ts`
```typescript
{
  to: string,
  text: string,  // Novo texto
  messageKey: {    // Chave da mensagem a editar
    remoteJid: string,
    fromMe: boolean,
    id: string,
    participant?: string
  },
  quoted?, ephemeralExpiration?, statusJidList?
}
```

**Content para Whaileys**:
```typescript
{
  text: dto.text,
  edit: dto.messageKey
}
```

---

### 7. Forward Message (Correção)
**Rota**: `POST /messages/:sessionId/forward` (já existe)

**DTO Atual**: `SendForwardMessageDto` (manter)

**Problema**: Requer message store para recuperar mensagem original

**Solução Proposta**:
- Adicionar campo `message` no DTO para passar mensagem completa
- Ou criar endpoint para buscar mensagem do histórico

**DTO Atualizado**: `src/messages/dto/send-forward-message.dto.ts`
```typescript
{
  to: string,
  message: object,  // proto.IWebMessageInfo completo
  force?: boolean,
  quoted?, ephemeralExpiration?, statusJidList?
}
```

**Content para Whaileys**:
```typescript
{
  forward: dto.message,
  force: dto.force
}
```

---

### 8. Live Location
**Rota**: `POST /messages/:sessionId/live-location`

**DTO**: `src/messages/dto/send-live-location-message.dto.ts`
```typescript
{
  to: string,
  latitude: number,
  longitude: number,
  accuracy?: number,
  speed?: number,
  degreesClockwise?: number,
  caption?: string,
  sequenceNumber?: number,
  timeOffset?: number,
  jpegThumbnail?: string,
  contextInfo?: object,
  quoted?, ephemeralExpiration?, statusJidList?
}
```

**Content para Whaileys**:
```typescript
{
  liveLocation: {
    degreesLatitude: dto.latitude,
    degreesLongitude: dto.longitude,
    accuracyInMeters: dto.accuracy,
    speedInMps: dto.speed,
    degreesClockwiseFromMagneticNorth: dto.degreesClockwise,
    caption: dto.caption,
    sequenceNumber: dto.sequenceNumber,
    timeOffset: dto.timeOffset,
    jpegThumbnail: dto.jpegThumbnail,
    contextInfo: dto.contextInfo
  }
}
```

---

## Correções na Implementação Atual

### 1. Remover `footer` de SendTextMessageDto

**Arquivo**: `src/messages/dto/send-text-message.dto.ts`

**Ação**: Deletar propriedade `footer`

**Motivo**: Footer só é usado em Buttons, Template e List

---

### 2. Atualizar SendForwardMessageDto

**Arquivo**: `src/messages/dto/send-forward-message.dto.ts`

**Mudanças**:
- Remover `messageId: string`
- Remover `fromJid: string`
- Adicionar `message: object` (proto.IWebMessageInfo)

**Nova estrutura**:
```typescript
{
  to: string,
  message: object,  // Mensagem completa a encaminhar
  force?: boolean,
  quoted?, ephemeralExpiration?, statusJidList?
}
```

---

### 3. Implementar forwardMessage

**Arquivo**: `src/messages/messages.service.ts`

**Substituir**:
```typescript
async forwardMessage(sessionId: string, dto: SendForwardMessageDto) {
  const socket = await this.validateSessionConnected(sessionId);
  const jid = this.formatJid(dto.to);
  
  const content: AnyMessageContent = {
    forward: dto.message,
    force: dto.force
  };
  
  const message = await socket.sendMessage(jid, content);
  
  if (!message) {
    throw new BadRequestException('Failed to forward message');
  }
  
  return this.mapToMessageResponseDto(message);
}
```

---

## Estrutura de Arquivos a Criar

### DTOs (8 novos)
```
src/messages/dto/
├── send-buttons-message.dto.ts
├── send-template-message.dto.ts
│   ├── url-button.dto.ts
│   ├── call-button.dto.ts
│   ├── quick-reply-button.dto.ts
│   └── template-button.dto.ts
├── send-list-message.dto.ts
│   ├── list-row.dto.ts
│   └── list-section.dto.ts
├── send-poll-message.dto.ts
├── send-interactive-message.dto.ts
├── edit-message.dto.ts
└── send-live-location-message.dto.ts
```

### Controller (8 novas rotas)
**Arquivo**: `src/messages/messages.controller.ts`

**Adicionar**:
- `POST /:sessionId/buttons`
- `POST /:sessionId/template`
- `POST /:sessionId/list`
- `POST /:sessionId/poll`
- `POST /:sessionId/interactive`
- `POST /:sessionId/edit`
- `POST /:sessionId/live-location`
- Atualizar `POST /:sessionId/forward` (documentação)

### Service (8 novos métodos)
**Arquivo**: `src/messages/messages.service.ts`

**Adicionar**:
- `sendButtonsMessage()`
- `sendTemplateMessage()`
- `sendListMessage()`
- `sendPollMessage()`
- `sendInteractiveMessage()`
- `editMessage()`
- `sendLiveLocationMessage()`
- Atualizar `forwardMessage()`

---

## Validações por Tipo

### Buttons Message
- `buttons` array não vazio
- `buttonId` únicos
- `headerType` válido (1 ou 4)
- Se `headerType = 4`, `image` obrigatório

### Template Message
- `templateButtons` array não vazio
- `index` únicos e sequenciais
- Cada botão tem exatamente um tipo (url, call ou quickReply)

### List Message
- `buttonText` obrigatório
- `sections` não vazio
- Cada section tem ao menos 1 row
- `rowId` únicos globalmente

### Poll Message
- `name` obrigatório
- `options` array com 2-12 opções
- `selectableCount` entre 0 e length(options)

### Edit Message
- `messageKey` válido
- `text` não vazio

### Forward Message
- `message` é objeto válido proto.IWebMessageInfo

---

## Plano de Implementação

### Fase 1: Correções (Prioridade Crítica)
- [ ] Remover `footer` de `send-text-message.dto.ts`
- [ ] Atualizar `send-forward-message.dto.ts`
- [ ] Implementar `forwardMessage()` funcional
- [ ] Testar forward com mensagem completa

### Fase 2: Mensagens Interativas Básicas (Prioridade Alta)
- [ ] Criar DTOs de botões (url, call, quickReply)
- [ ] Criar `send-buttons-message.dto.ts`
- [ ] Implementar `sendButtonsMessage()`
- [ ] Criar rota `POST /:sessionId/buttons`
- [ ] Testar buttons simples e com imagem

- [ ] Criar `template-button.dto.ts`
- [ ] Criar `send-template-message.dto.ts`
- [ ] Implementar `sendTemplateMessage()`
- [ ] Criar rota `POST /:sessionId/template`
- [ ] Testar template com URL, Call, QuickReply

### Fase 3: Listas e Enquetes (Prioridade Alta)
- [ ] Criar `list-row.dto.ts` e `list-section.dto.ts`
- [ ] Criar `send-list-message.dto.ts`
- [ ] Implementar `sendListMessage()`
- [ ] Criar rota `POST /:sessionId/list`
- [ ] Testar lista com múltiplas sections

- [ ] Criar `send-poll-message.dto.ts`
- [ ] Implementar `sendPollMessage()`
- [ ] Criar rota `POST /:sessionId/poll`
- [ ] Testar poll single e multiple choice

### Fase 4: Mensagens Avançadas (Prioridade Média)
- [ ] Criar `edit-message.dto.ts`
- [ ] Implementar `editMessage()`
- [ ] Criar rota `POST /:sessionId/edit`
- [ ] Testar edição de mensagens

- [ ] Criar `send-interactive-message.dto.ts`
- [ ] Implementar `sendInteractiveMessage()`
- [ ] Criar rota `POST /:sessionId/interactive`
- [ ] Documentar estrutura proto.IInteractiveMessage

### Fase 5: Localização Ao Vivo (Prioridade Baixa)
- [ ] Criar `send-live-location-message.dto.ts`
- [ ] Implementar `sendLiveLocationMessage()`
- [ ] Criar rota `POST /:sessionId/live-location`
- [ ] Testar live location

### Fase 6: Validação Final
- [ ] Executar build (`npm run build`)
- [ ] Testar todas as 20 rotas de mensagens
- [ ] Validar documentação Swagger
- [ ] Atualizar README/docs com novos tipos

---

## Total de Implementações

### Arquivos a Criar
- **15 DTOs novos** (8 principais + 7 nested)
- **8 métodos novos** no MessagesService
- **8 rotas novas** no MessagesController

### Arquivos a Modificar
- **1 DTO** (send-text-message.dto.ts - remover footer)
- **1 DTO** (send-forward-message.dto.ts - estrutura)
- **1 método** (forwardMessage - implementação real)

### Rotas Totais
- **Antes**: 12 rotas de mensagens
- **Depois**: 20 rotas de mensagens (+8)

---

## Mapeamento Completo de Rotas

### Rotas Existentes (12)
1. `POST /messages/:sessionId/text`
2. `POST /messages/:sessionId/image`
3. `POST /messages/:sessionId/video`
4. `POST /messages/:sessionId/audio`
5. `POST /messages/:sessionId/document`
6. `POST /messages/:sessionId/sticker`
7. `POST /messages/:sessionId/contact`
8. `POST /messages/:sessionId/location`
9. `POST /messages/:sessionId/react`
10. `POST /messages/:sessionId/forward` (corrigir)
11. `DELETE /messages/:sessionId/delete`
12. `POST /messages/:sessionId/disappearing`

### Rotas Novas (8)
13. `POST /messages/:sessionId/buttons` ⭐
14. `POST /messages/:sessionId/template` ⭐
15. `POST /messages/:sessionId/list` ⭐
16. `POST /messages/:sessionId/poll` ⭐
17. `POST /messages/:sessionId/interactive` ⭐
18. `POST /messages/:sessionId/edit` ⭐
19. `POST /messages/:sessionId/live-location` ⭐

### Total Final: 20 Rotas de Envio de Mensagens

---

## Dependências e Imports

### Novos Imports em messages.service.ts
```typescript
import { SendButtonsMessageDto } from './dto/send-buttons-message.dto';
import { SendTemplateMessageDto } from './dto/send-template-message.dto';
import { SendListMessageDto } from './dto/send-list-message.dto';
import { SendPollMessageDto } from './dto/send-poll-message.dto';
import { SendInteractiveMessageDto } from './dto/send-interactive-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { SendLiveLocationMessageDto } from './dto/send-live-location-message.dto';
```

### Novos Imports em messages.controller.ts
- Mesmos DTOs acima

---

## Riscos e Mitigações

### Riscos
1. **Complexidade dos DTOs nested** (template buttons, list sections)
   - Mitigação: Validações com `@ValidateNested()` e `@Type()`

2. **Compatibilidade com versões WhatsApp**
   - Mitigação: Documentar versões mínimas requeridas

3. **Tamanho das listas/buttons**
   - Mitigação: Adicionar validações de limite (ex: máx 3 buttons)

### Breaking Changes
- ✅ **Nenhum** nas rotas existentes
- ⚠️ `SendForwardMessageDto` mudará estrutura (breaking para quem usa)

---

## Checklist de Implementação

### Correções Urgentes
- [ ] Remover `footer` de SendTextMessageDto
- [ ] Atualizar SendForwardMessageDto
- [ ] Implementar forwardMessage funcional

### Botões e Templates
- [ ] DTOs de botões (4 arquivos)
- [ ] SendButtonsMessageDto
- [ ] SendTemplateMessageDto
- [ ] Métodos no service (2)
- [ ] Rotas no controller (2)

### Listas e Enquetes
- [ ] DTOs de lista (3 arquivos)
- [ ] SendListMessageDto
- [ ] SendPollMessageDto
- [ ] Métodos no service (2)
- [ ] Rotas no controller (2)

### Avançados
- [ ] EditMessageDto
- [ ] SendInteractiveMessageDto
- [ ] SendLiveLocationMessageDto
- [ ] Métodos no service (3)
- [ ] Rotas no controller (3)

### Validação Final
- [ ] Build sem erros
- [ ] Swagger atualizado
- [ ] Testes das 20 rotas
- [ ] Documentação completa
