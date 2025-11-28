# Analise de Campos de Mensagem - ZPWoot

## RESUMO DA ANALISE DO BANCO DE DADOS

### Tabelas Analisadas
| Tabela | Registros | Observacoes |
|--------|-----------|-------------|
| zpMessages | 7 | Todas recebidas, nenhuma enviada |
| zpMessageUpdates | 12 | Todas reacoes |
| zpSessions | 1 | mysession (connected) |
| zpWebhooks | 0 | Nenhum configurado |

### Problemas Encontrados
| Problema | Severidade | Status |
|----------|------------|--------|
| deliveredAt NULL para status=delivered | CRITICO | CORRIGIDO no codigo |
| content vazio para midia | NORMAL | Esperado (caption pode vir separado) |
| serverID nao extraido | BAIXO | Opcional (disponivel no rawEvent) |
| verifiedName nao extraido | BAIXO | Opcional (disponivel no rawEvent) |

---

## 1. INCONSISTENCIA CRITICA ENCONTRADA

### Status "delivered" sem deliveredAt

```json
{
  "status": "delivered",
  "deliveredAt": null  // INCONSISTENCIA!
}
```

**Problema:** Quando uma mensagem e recebida (isFromMe=false), o status e definido como "delivered" mas `deliveredAt` nao e preenchido.

**Codigo atual (event.go:282-284):**
```go
status := model.MessageStatusSent
if !e.Info.IsFromMe {
    status = model.MessageStatusDelivered  // Define status mas nao preenche deliveredAt
}
```

**Correcao necessaria:**
```go
var deliveredAt *time.Time
status := model.MessageStatusSent
if !e.Info.IsFromMe {
    status = model.MessageStatusDelivered
    now := e.Info.Timestamp
    deliveredAt = &now  // Preencher deliveredAt
}
```

---

## 2. CAMPOS DO rawEvent NAO EXTRAIDOS

Campos disponiveis no `rawEvent.Info` que NAO estao sendo salvos em colunas separadas:

| Campo | Descricao | Utilidade | Recomendacao |
|-------|-----------|-----------|--------------|
| `ServerID` | ID do servidor | Ordenacao temporal precisa | Adicionar |
| `Multicast` | Se e broadcast | Identificar broadcasts | Opcional |
| `VerifiedName` | Nome verificado (business) | Identificar contas verificadas | Adicionar |
| `RecipientAlt` | LID do destinatario | Rastreamento alternativo | Opcional |
| `AddressingMode` | Modo de enderecamento | Debug | Nao necessario |
| `BroadcastListOwner` | Dono da lista broadcast | Broadcasts | Opcional |

### Campos Recomendados para Adicionar

#### 2.1 `serverID` (BIGINT)
```sql
ALTER TABLE "zpMessages" ADD COLUMN "serverID" BIGINT;
CREATE INDEX "idx_zpMessages_serverID" ON "zpMessages"("serverID");
```

**Uso:** Ordenacao precisa de mensagens (mais confiavel que timestamp em alta frequencia)

#### 2.2 `verifiedName` (VARCHAR)
```sql
ALTER TABLE "zpMessages" ADD COLUMN "verifiedName" VARCHAR(255);
```

**Uso:** Identificar mensagens de contas business verificadas

---

## 3. CAMPOS EXISTENTES - ANALISE

### Campos Corretamente Extraidos :white_check_mark:

| Campo DB | Campo whatsmeow | Status |
|----------|-----------------|--------|
| messageId | Info.ID | OK |
| chatJid | Info.Chat | OK |
| senderJid | Info.Sender | OK |
| timestamp | Info.Timestamp | OK |
| pushName | Info.PushName | OK |
| senderAlt | Info.SenderAlt | OK |
| type | Info.Type (parsed) | OK |
| mediaType | Info.MediaType | OK |
| category | Info.Category | OK |
| content | Message.* (parsed) | OK |
| isFromMe | Info.IsFromMe | OK |
| isGroup | Info.IsGroup | OK |
| isEphemeral | IsEphemeral | OK |
| isViewOnce | IsViewOnce/V2 | OK |
| isEdit | IsEdit | OK |
| quotedId | MsgMetaInfo.TargetID | OK |
| quotedSender | MsgMetaInfo.TargetSender | OK |

### Campos com Problemas :warning:

| Campo | Problema | Impacto |
|-------|----------|---------|
| deliveredAt | Nao preenchido para msgs recebidas | Inconsistencia status/timestamp |
| readAt | Depende de Receipt events | OK (preenchido depois) |
| editTargetId | Extraido de MsgBotInfo | OK |

---

## 4. ESTRUTURA DO rawEvent

```
rawEvent
├── Info
│   ├── ID                    -> messageId
│   ├── Chat                  -> chatJid
│   ├── Sender                -> senderJid
│   ├── Timestamp             -> timestamp
│   ├── PushName              -> pushName
│   ├── SenderAlt             -> senderAlt
│   ├── Type                  -> type (apos parsing)
│   ├── MediaType             -> mediaType
│   ├── Category              -> category
│   ├── IsFromMe              -> isFromMe
│   ├── IsGroup               -> isGroup
│   ├── ServerID              -> [NAO EXTRAIDO]
│   ├── Multicast             -> [NAO EXTRAIDO]
│   ├── VerifiedName          -> [NAO EXTRAIDO]
│   ├── RecipientAlt          -> [NAO EXTRAIDO]
│   ├── AddressingMode        -> [NAO EXTRAIDO]
│   ├── MsgBotInfo
│   │   ├── EditType          -> [usado para isEdit]
│   │   └── EditTargetID      -> editTargetId
│   └── MsgMetaInfo
│       ├── TargetID          -> quotedId
│       ├── TargetSender      -> quotedSender
│       └── ThreadMessageID   -> [NAO EXTRAIDO]
├── IsEdit                    -> isEdit
├── IsEphemeral               -> isEphemeral
├── IsViewOnce                -> isViewOnce
├── IsViewOnceV2              -> isViewOnce
└── Message                   -> content (apos parsing)
```

---

## 5. ACOES RECOMENDADAS

### Prioridade Alta
1. [ ] **Corrigir deliveredAt** - Preencher quando status=delivered
2. [ ] **Adicionar serverID** - Melhor ordenacao

### Prioridade Media
3. [ ] **Adicionar verifiedName** - Identificar business verificados
4. [ ] **Adicionar threadMessageId** - Suporte a threads

### Prioridade Baixa
5. [ ] **Adicionar multicast** - Identificar broadcasts
6. [ ] **Adicionar recipientAlt** - LID tracking

---

## 6. EXEMPLO DE MIGRACAO

```sql
-- Migracao para novos campos
ALTER TABLE "zpMessages" 
    ADD COLUMN IF NOT EXISTS "serverID" BIGINT,
    ADD COLUMN IF NOT EXISTS "verifiedName" VARCHAR(255),
    ADD COLUMN IF NOT EXISTS "threadMessageId" VARCHAR(255);

-- Index para serverID
CREATE INDEX IF NOT EXISTS "idx_zpMessages_serverID" 
    ON "zpMessages"("serverID") WHERE "serverID" IS NOT NULL;

-- Corrigir deliveredAt para mensagens existentes
UPDATE "zpMessages" 
SET "deliveredAt" = "timestamp" 
WHERE "status" = 'delivered' 
  AND "deliveredAt" IS NULL 
  AND "isFromMe" = false;
```

---

## 7. DADOS REAIS DO BANCO (zpMessages)

### Distribuicao por Tipo
| Tipo | Qtd | Content Vazio |
|------|-----|---------------|
| text | 1 | 0 |
| image | 1 | 1 (normal, caption no rawEvent) |
| audio | 1 | 1 (normal, e PTT) |
| document | 1 | 0 (tem filename) |
| location | 1 | 0 (tem coords) |
| live_location | 1 | 1 (normal) |
| interactive | 1 | 1 (body no rawEvent) |

### Status das Mensagens
| Status | Qtd | Com deliveredAt | Com readAt |
|--------|-----|-----------------|------------|
| delivered | 7 | **0** (BUG!) | 0 |

### Campos Preenchidos
| Campo | Preenchido |
|-------|------------|
| pushName | 7/7 (100%) |
| senderAlt | 7/7 (100%) |
| mediaType | 5/7 (71%) |
| quotedId | 0/7 (0% - sem quotes) |
| category | 0/7 (0%) |

### Dados do zpMessageUpdates
| Tipo | Qtd | Exemplo |
|------|-----|---------|
| reaction | 12 | emojis: 👍, 😢, 🤝 |

---

## Conclusao

| Categoria | Quantidade |
|-----------|------------|
| Campos OK | 17 |
| Campos com Problema | 1 (deliveredAt) - **JA CORRIGIDO** |
| Campos Recomendados | 3 (serverID, verifiedName, threadMessageId) |
| Campos Opcionais | 3 (multicast, recipientAlt, broadcastInfo) |

**Status:** Bug de `deliveredAt` corrigido em `event.go`. Migracao criada em `005_fix_delivered_at.sql`.
