# Comparação de Features: Zpwoot vs Evolution API (Chatwoot Integration)

Este documento compara as funcionalidades da integração Chatwoot entre o **Zpwoot** e a **Evolution API**.

---

## ✅ Features Implementadas no Zpwoot

| Feature | Descrição | Status |
|---------|-----------|--------|
| **signMsg** | Assinatura de mensagens com nome do remetente | ✅ Implementado |
| **signDelimiter** | Delimitador customizável entre assinatura e mensagem | ✅ Implementado |
| **Encaminhamento de Reações** | Reações do WhatsApp aparecem no Chatwoot | ✅ Implementado |
| **Mensagens WhatsApp → Chatwoot** | Encaminhamento de mensagens recebidas | ✅ Implementado |
| **Mensagens Chatwoot → WhatsApp** | Envio de mensagens do agente | ✅ Implementado |
| **Suporte a Reply** | in_reply_to e in_reply_to_external_id | ✅ Implementado |
| **Mídia (imagem, vídeo, áudio, documento)** | Upload e download de arquivos | ✅ Implementado |
| **Criação/Atualização de Contatos** | Sincronização de contatos | ✅ Implementado |
| **Gerenciamento de Conversas** | Criação e gestão de conversas | ✅ Implementado |
| **Deleção de Mensagens** | Encaminhamento de mensagens deletadas | ✅ Implementado |
| **Edição de Mensagens** | Encaminhamento de mensagens editadas | ✅ Implementado |
| **reopenConversation** | Reabrir conversas resolvidas | ✅ Implementado |
| **conversationPending** | Criar conversas como pendentes | ✅ Implementado |
| **mergeBrazilContacts** | Merge de contatos brasileiros (com/sem 9) | ✅ Implementado |
| **ignoreJids** | Lista de JIDs a ignorar | ✅ Implementado |
| **Criação automática de Inbox** | Cria inbox automaticamente se não existir | ✅ Implementado |
| **Formatação de Location Message** | Coordenadas + link Google Maps | ✅ Implementado |
| **Formatação de Contact Message** | Parse de vCard com nome/telefone/email | ✅ Implementado |
| **Ads/Link Preview Message** | Preview de links compartilhados | ✅ Implementado |
| **Sincronização de Foto de Perfil** | Atualiza avatar do contato automaticamente | ✅ Implementado |
| **Bot Contact & QR Code** | Gerenciar sessão pelo Chatwoot | ✅ Implementado |
| **Notificações de Conexão** | Status updates no Chatwoot | ✅ Implementado |
| **Comandos do Bot** | /init, /status, /disconnect, /help | ✅ Implementado |

---

## ❌ Features NÃO Implementadas (Presentes na Evolution API)

### 🔴 Prioridade Alta

#### 1. **Bot Contact & QR Code no Chatwoot**
Permite gerenciar a sessão WhatsApp diretamente pelo Chatwoot através de um contato bot.

**Funcionalidades:**
- Enviar QR Code como imagem no Chatwoot
- Comandos: `/init`, `/status`, `/disconnect`, `/clearcache`
- Notificações de conexão/desconexão
- Pairing code para conexão por código

**Código Evolution API:**
```typescript
// Criar contato bot (123456)
const contact = await this.createContact(instance, '123456', inboxId, false, 'EvolutionAPI', logo);

// Comandos disponíveis
if (command.includes('init')) { await waInstance.connectToWhatsapp(number); }
if (command === 'status') { await this.createBotMessage(instance, statusMsg, 'incoming'); }
if (command === 'disconnect') { await waInstance?.client?.logout(); }
if (command === 'clearcache') { waInstance.clearCacheChatwoot(); }

// QR Code
if (event === 'qrcode.updated') {
  await this.createBotQr(instance, 'QR Generated', 'incoming', fileStream, 'qr.png');
  await this.createBotMessage(instance, msgQrCode, 'incoming');
}
```

---

#### 2. **Formatação de Location Message**
Atualmente o Zpwoot mostra apenas `[Location]`. A Evolution API formata com coordenadas e link do Google Maps.

**Código Evolution API:**
```typescript
if (typeKey === 'locationMessage' || typeKey === 'liveLocationMessage') {
  const latitude = result.degreesLatitude;
  const longitude = result.degreesLongitude;
  const locationName = result?.name;
  const locationAddress = result?.address;

  const formattedLocation =
    `*Localização:*\n\n` +
    `_Latitude:_ ${latitude} \n` +
    `_Longitude:_ ${longitude} \n` +
    (locationName ? `_Nome:_ ${locationName}\n` : '') +
    (locationAddress ? `_Endereço:_ ${locationAddress} \n` : '') +
    `_URL:_ https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return formattedLocation;
}
```

---

#### 3. **Formatação de Contact Message (vCard)**
Atualmente mostra apenas `[Contact]`. Deveria parsear o vCard e mostrar nome/telefone.

**Código Evolution API:**
```typescript
if (typeKey === 'contactMessage') {
  const vCardData = result.split('\n');
  const contactInfo = {};
  vCardData.forEach((line) => {
    const [key, value] = line.split(':');
    if (key && value) contactInfo[key] = value;
  });
  // Formata e retorna info do contato
}
```

---

### 🟡 Prioridade Média

#### 4. **Ads Message (Mensagens de Anúncio)**
Mensagens com preview de anúncio/link compartilhado.

**Código Evolution API:**
```typescript
private getAdsMessage(msg: any) {
  return {
    title: msg.extendedTextMessage?.contextInfo?.externalAdReply?.title,
    body: msg.extendedTextMessage?.contextInfo?.externalAdReply?.body,
    thumbnailUrl: msg.extendedTextMessage?.contextInfo?.externalAdReply?.thumbnailUrl,
    sourceUrl: msg.extendedTextMessage?.contextInfo?.externalAdReply?.sourceUrl,
  };
}

// Envia com thumbnail e formatação
if (isAdsMessage) {
  const imgBuffer = await axios.get(adsMessage.thumbnailUrl, { responseType: 'arraybuffer' });
  // Processa imagem com Jimp para thumbnail
  await this.sendData(conversationId, fileStream, nameFile, messageType,
    `${bodyMessage}\n\n**${title}**\n${description}\n${sourceUrl}`);
}
```

---

#### 5. **Sincronização de Foto de Perfil**
Atualiza automaticamente a foto de perfil do contato no Chatwoot.

**Código Evolution API:**
```typescript
const picture_url = await waInstance.profilePicture(chatId);

if (pictureNeedsUpdate) {
  await this.updateContact(instance, contact.id, {
    avatar_url: picture_url?.profilePictureUrl
  });
}
```

---

#### 6. **Labels/Tags nos Contatos**
Adiciona label do inbox ao contato (requer conexão direta ao PostgreSQL do Chatwoot).

**Código Evolution API:**
```typescript
public async addLabelToContact(nameInbox: string, contactId: number) {
  const sqlTag = `INSERT INTO tags (name, taggings_count) VALUES ($1, $2)...`;
  const sqlInsertLabel = `INSERT INTO taggings (tag_id, taggable_type, taggable_id, context, created_at)...`;
  await this.pgClient.query(sqlInsertLabel, [tagId, contactId]);
}
```

---

### 🟢 Prioridade Baixa

#### 7. **Import de Histórico de Mensagens**
Importa mensagens históricas do WhatsApp para o Chatwoot (requer conexão PostgreSQL).

**Funcionalidades:**
- `importContacts`: Importa contatos existentes
- `importMessages`: Importa histórico de mensagens
- `daysLimitImportMessages`: Limite de dias para importação

---

#### 8. **Sync Lost Messages**
Sincroniza mensagens que podem ter sido perdidas nas últimas 6 horas.

```typescript
public async syncLostMessages(instance, chatwootConfig, prepareMessage) {
  const sqlMessages = `select * from messages where created_at >= now() - interval '6h'`;
  // Compara com mensagens salvas e sincroniza as faltantes
}
```

---

#### 9. **Cache de Conversas com Lock**
Sistema de cache com lock para evitar criação duplicada de conversas em requests paralelos.

```typescript
private readonly LOCK_POLLING_DELAY_MS = 300;

// Adquire lock antes de criar conversa
await this.cache.set(lockKey, true, 30);
// Verifica se já existe em cache
if (await this.cache.has(cacheKey)) return cached;
```

---

#### 10. **Notificações de Status de Conexão**
Envia mensagens ao Chatwoot sobre mudanças de status da conexão.

```typescript
if (event === 'connection.update' && body.status === 'open') {
  await this.createBotMessage(instance, 'Conectado!', 'incoming');
}

if (event === 'status.instance') {
  await this.createBotMessage(instance, `Status: ${data.status}`, 'incoming');
}
```

---

## 📊 Resumo

| Categoria | Zpwoot | Evolution API |
|-----------|--------|---------------|
| Features Core | ✅ 16/16 | ✅ 16/16 |
| Bot/QR Management | ❌ 0/5 | ✅ 5/5 |
| Formatação Avançada | ❌ 0/3 | ✅ 3/3 |
| Import/Sync | ❌ 0/3 | ✅ 3/3 |
| Cache Avançado | ⚠️ Parcial | ✅ Completo |

---

## 🎯 Recomendações de Implementação

### Fase 1 (Quick Wins)
1. **Formatação de Location Message** - Fácil, alto impacto visual
2. **Formatação de Contact Message** - Fácil, melhora UX

### Fase 2 (Médio Esforço)
3. **Ads Message** - Requer download de thumbnail e processamento
4. **Sincronização de Foto de Perfil** - Requer chamada adicional à API WhatsApp

### Fase 3 (Alto Esforço)
5. **Bot Contact & QR Code** - Requer reestruturação do fluxo de conexão
6. **Import de Histórico** - Requer conexão PostgreSQL ao Chatwoot
7. **Labels/Tags** - Requer conexão PostgreSQL ao Chatwoot

---

## 📝 Notas

- Features que requerem conexão direta ao PostgreSQL do Chatwoot são mais complexas e podem ter implicações de segurança
- O Bot Contact é muito útil para ambientes multi-tenant onde usuários gerenciam suas próprias sessões
- A formatação de Location e Contact são melhorias de UX de baixo esforço com alto impacto

---

*Última atualização: 2025-11-26*
