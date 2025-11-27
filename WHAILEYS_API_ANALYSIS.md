# Analise de Cobertura da API Whaileys

Este documento compara os metodos disponiveis na biblioteca [whaileys](https://github.com/canove/whaileys) com a implementacao atual em `src/api/`.

## Resumo

| Modulo | Implementados | Faltando | Cobertura |
|--------|--------------|----------|-----------|
| Sessions | 9 | 0 | 100% |
| Messages | 17 | 2 | 89% |
| Groups | 16 | 0 | 100% |
| Chats | 8 | 2 | 80% |
| Contacts | 10 | 0 | 100% |
| Profiles | 8 | 0 | 100% |
| Privacy | 9 | 0 | 100% |

---

## Sessions (`src/api/sessions/`)

### Implementados
- [x] `create` - Criar sessao
- [x] `findAll` - Listar todas sessoes
- [x] `connect` - Conectar sessao
- [x] `getQr` - Obter QR code
- [x] `getStatus` - Status da sessao
- [x] `logout` - Fazer logout
- [x] `restart` - Reiniciar sessao
- [x] `remove` - Deletar sessao
- [x] `getInfo` - Informacoes da sessao

### Faltando
Nenhum metodo essencial faltando.

---

## Messages (`src/api/messages/`)

### Implementados
- [x] `sendText` - Enviar texto
- [x] `sendImage` - Enviar imagem
- [x] `sendVideo` - Enviar video
- [x] `sendAudio` - Enviar audio
- [x] `sendDocument` - Enviar documento
- [x] `sendLocation` - Enviar localizacao
- [x] `sendContact` - Enviar contato (vCard)
- [x] `sendSticker` - Enviar sticker
- [x] `sendReaction` - Enviar reacao
- [x] `sendButtons` - Enviar botoes
- [x] `sendList` - Enviar lista
- [x] `sendTemplate` - Enviar template
- [x] `forwardMessage` - Encaminhar mensagem
- [x] `deleteMessage` - Deletar mensagem (para todos)
- [x] `deleteMessageForMe` - Deletar mensagem (para mim)
- [x] `readMessages` - Marcar como lido

### Faltando
- [ ] `sendLinkPreview` - Enviar mensagem com preview de link customizado
- [ ] `updateMediaMessage` - Atualizar media de mensagem (re-upload)

---

## Groups (`src/api/groups/`)

### Implementados
- [x] `createGroup` - Criar grupo
- [x] `getGroupMetadata` - Metadados do grupo
- [x] `updateGroupSubject` - Atualizar nome do grupo
- [x] `updateGroupDescription` - Atualizar descricao
- [x] `updateParticipants` - Add/remove/promote/demote participantes
- [x] `updateGroupSettings` - Atualizar configuracoes (announcement/locked)
- [x] `getInviteCode` - Obter codigo de convite
- [x] `revokeInviteCode` - Revogar codigo de convite
- [x] `getGroupInfoByCode` - Info do grupo pelo codigo
- [x] `joinGroup` - Entrar no grupo
- [x] `leaveGroup` - Sair do grupo
- [x] `updateGroupPicture` - Atualizar foto do grupo
- [x] `acceptInviteV4` - Aceitar convite V4
- [x] `fetchAllParticipating` - Listar todos os grupos que participa
- [x] `toggleEphemeral` - Ativar/desativar mensagens temporarias no grupo

### Faltando
Nenhum metodo essencial faltando.

---

## Chats (`src/api/chats/`)

### Implementados
- [x] `archive` - Arquivar/desarquivar chat
- [x] `mute` - Silenciar chat
- [x] `pin` - Fixar chat
- [x] `markRead` - Marcar como lido/nao lido
- [x] `delete` - Deletar chat
- [x] `setDisappearingMessages` - Mensagens temporarias
- [x] `starMessage` - Favoritar mensagem

### Faltando
- [ ] `clearMessages` - Limpar mensagens do chat
- [ ] `fetchMessages` - Buscar historico de mensagens
- [ ] `getBlocklist` - Listar contatos bloqueados (pode ir em contacts)

---

## Contacts (`src/api/contacts/`)

### Implementados
- [x] `block` - Bloquear contato
- [x] `unblock` - Desbloquear contato
- [x] `checkNumber` - Verificar se numero existe no WhatsApp
- [x] `getProfilePicture` - Foto de perfil do contato
- [x] `getStatus` - Status do contato
- [x] `getBusinessProfile` - Perfil comercial
- [x] `getBroadcastListInfo` - Info de lista de transmissao

### Faltando
- [ ] `getBlocklist` - Listar contatos bloqueados (`fetchBlocklist`)
- [ ] `addContact` - Adicionar contato ao catalogo (`addOrEditContact`)
- [ ] `removeContact` - Remover contato do catalogo (`removeContact`)

---

## Profiles (`src/api/profiles/`)

### Implementados
- [x] `updateStatus` - Atualizar status do perfil
- [x] `updateName` - Atualizar nome do perfil
- [x] `updatePicture` - Atualizar foto do perfil
- [x] `updatePresence` - Atualizar presenca (online/typing)
- [x] `subscribePresence` - Assinar presenca de contato

### Faltando
- [ ] `getProfilePicture` - Obter propria foto de perfil
- [ ] `removeProfilePicture` - Remover foto de perfil
- [ ] `getMyStatus` - Obter proprio status

---

## Privacy (NAO IMPLEMENTADO)

O whaileys oferece varios metodos para configuracoes de privacidade que nao estao implementados:

### Faltando (Novo modulo sugerido: `src/api/privacy/`)
- [ ] `fetchPrivacySettings` - Obter configuracoes de privacidade
- [ ] `updateLastSeenPrivacy` - Privacidade do "visto por ultimo"
- [ ] `updateOnlinePrivacy` - Privacidade do status online
- [ ] `updateProfilePicturePrivacy` - Privacidade da foto de perfil
- [ ] `updateStatusPrivacy` - Privacidade do status
- [ ] `updateReadReceiptsPrivacy` - Privacidade de confirmacao de leitura
- [ ] `updateGroupsAddPrivacy` - Quem pode adicionar em grupos
- [ ] `updateCallPrivacy` - Quem pode ligar
- [ ] `updateMessagesPrivacy` - Privacidade de mensagens

---

## Metodos do Socket Whaileys Disponiveis

### Socket Base (`makeSocket`)
```typescript
- ev                    // Event emitter
- ws                    // WebSocket
- authState            // Estado de autenticacao
- user                 // Usuario conectado
- generateMessageTag   // Gerar tag de mensagem
- query               // Query generica
- sendNode            // Enviar node
- logout              // Logout
- end                 // Encerrar conexao
- waitForConnectionUpdate
- waitForMessage
```

### Chats (`makeChatsSocket`)
```typescript
- fetchPrivacySettings
- upsertMessage
- appPatch
- sendPresenceUpdate
- presenceSubscribe
- profilePictureUrl
- onWhatsApp
- fetchBlocklist
- fetchStatus
- updateCallPrivacy
- updateMessagesPrivacy
- updateLastSeenPrivacy
- updateOnlinePrivacy
- updateProfilePicturePrivacy
- updateStatusPrivacy
- updateReadReceiptsPrivacy
- updateGroupsAddPrivacy
- updateProfilePicture
- updateProfileStatus
- updateProfileName
- updateBlockStatus
- getBusinessProfile
- resyncAppState
- addOrEditContact
- removeContact
- chatModify
```

### Groups (`makeGroupsSocket`)
```typescript
- groupMetadata
- groupCreate
- groupLeave
- groupUpdateSubject
- groupParticipantsUpdate
- groupUpdateDescription
- groupInviteCode
- groupRevokeInvite
- groupAcceptInvite
- groupAcceptInviteV4
- groupGetInviteInfo
- groupToggleEphemeral
- groupSettingUpdate
- groupFetchAllParticipating
```

### Messages (`makeMessagesSocket`)
```typescript
- getPrivacyTokens
- getUSyncDevices
- assertSessions
- relayMessage
- sendReceipt
- sendReceipts
- readMessages
- refreshMediaConn
- waUploadToServer
- sendPeerDataOperationMessage
- updateMediaMessage
- sendMessage
```

---

## Recomendacoes de Implementacao

### Prioridade Alta
1. **Privacy Module** - Criar novo modulo `src/api/privacy/` com todas as configuracoes de privacidade
2. **groupFetchAllParticipating** - Util para listar todos os grupos
3. **fetchBlocklist** - Listar contatos bloqueados

### Prioridade Media
4. **groupToggleEphemeral** - Mensagens temporarias em grupo
5. **addOrEditContact / removeContact** - Gestao de contatos
6. **updateMediaMessage** - Re-upload de media

### Prioridade Baixa
7. **sendLinkPreview** - Preview customizado de links
8. **clearMessages** - Limpar chat
9. **fetchMessages** - Historico de mensagens (requer store)

---

## Eventos Webhook Implementados

Os seguintes eventos estao sendo capturados e enviados via webhook:

- [x] `connection.update`
- [x] `messages.upsert`
- [x] `messages.update`
- [x] `messages.reaction`
- [x] `message-receipt.update`
- [x] `chats.upsert`
- [x] `chats.update`
- [x] `chats.delete`
- [x] `contacts.upsert`
- [x] `contacts.update`
- [x] `groups.upsert`
- [x] `groups.update`
- [x] `group-participants.update`
- [x] `presence.update`
- [x] `call`

### Eventos nao enviados para webhook (apenas log)
- `messaging-history.set`
- `blocklist.set`
- `blocklist.update`
- `creds.update`

---

*Documento gerado em: 2025-11-27*
*Versao whaileys: 6.4.3*
