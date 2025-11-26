# Zpwoot WhatsApp API - Lista Completa de Recursos Implementados

## Status: ✅ 100% Funcional

---

## 1. SESSIONS (`/sessions`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/sessions/create` | POST | Criar nova sessão | ✅ |
| 2 | `/sessions/list` | GET | Listar todas sessões | ✅ |
| 3 | `/sessions/:id/info` | GET | Informações da sessão | ✅ |
| 4 | `/sessions/:id/delete` | DELETE | Remover sessão | ✅ |
| 5 | `/sessions/:id/connect` | POST | Conectar sessão | ✅ |
| 6 | `/sessions/:id/disconnect` | POST | Desconectar sessão | ✅ |
| 7 | `/sessions/:id/logout` | POST | Logout (remove credenciais) | ✅ |
| 8 | `/sessions/:id/qr` | GET | Obter QR Code | ✅ |
| 9 | `/sessions/:id/pair` | POST | Parear com telefone | ✅ |
| 10 | `/sessions/:id/status` | GET | Status da conexão | ✅ |

**Total: 10 endpoints**

---

## 2. MESSAGES (`/sessions/:sessionId/messages`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/text` | POST | Enviar mensagem de texto | ✅ |
| 2 | `/image` | POST | Enviar imagem | ✅ |
| 3 | `/video` | POST | Enviar vídeo | ✅ |
| 4 | `/audio` | POST | Enviar áudio/PTT | ✅ |
| 5 | `/document` | POST | Enviar documento | ✅ |
| 6 | `/sticker` | POST | Enviar sticker | ✅ |
| 7 | `/contact` | POST | Enviar contato (vCard) | ✅ |
| 8 | `/location` | POST | Enviar localização | ✅ |
| 9 | `/live-location` | POST | Enviar localização ao vivo | ✅ |
| 10 | `/react` | POST | Enviar reação | ✅ |
| 11 | `/forward` | POST | Encaminhar mensagem | ✅ |
| 12 | `/delete` | DELETE | Deletar mensagem | ✅ |
| 13 | `/edit` | POST | Editar mensagem | ✅ |
| 14 | `/buttons` | POST | Mensagem com botões | ✅ |
| 15 | `/template` | POST | Mensagem template | ✅ |
| 16 | `/list` | POST | Mensagem com lista | ✅ |
| 17 | `/poll` | POST | Criar enquete | ✅ |
| 18 | `/interactive` | POST | Mensagem interativa | ✅ |
| 19 | `/disappearing` | POST | Config mensagens temporárias | ✅ |

**Total: 19 endpoints**

---

## 3. CHATS (`/sessions/:sessionId/chats`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/` | GET | Listar todos os chats | ✅ |
| 2 | `/:jid/archive` | POST | Arquivar chat | ✅ |
| 3 | `/:jid/unarchive` | POST | Desarquivar chat | ✅ |
| 4 | `/:jid/mute` | POST | Silenciar chat | ✅ |
| 5 | `/:jid/unmute` | POST | Dessilenciar chat | ✅ |
| 6 | `/:jid/pin` | POST | Fixar chat | ✅ |
| 7 | `/:jid/unpin` | POST | Desafixar chat | ✅ |
| 8 | `/:jid/mark-read` | POST | Marcar como lido | ✅ |
| 9 | `/:jid/mark-unread` | POST | Marcar como não lido | ✅ |
| 10 | `/:jid` | DELETE | Deletar chat | ✅ |
| 11 | `/:jid/clear` | POST | Limpar mensagens | ✅ |
| 12 | `/read-messages` | POST | Marcar múltiplas como lidas | ✅ |
| 13 | `/:jid/star` | POST | Favoritar mensagem | ✅ |
| 14 | `/history` | POST | Buscar histórico de mensagens | ✅ |
| 15 | `/receipt` | POST | Enviar recibo de leitura | ✅ |
| 16 | `/receipts` | POST | Enviar recibos em lote | ✅ |
| 17 | `/placeholder-resend` | POST | Reenviar mensagens placeholder | ✅ |

**Total: 17 endpoints**

---

## 4. GROUPS (`/sessions/:sessionId/groups`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/` | GET | Listar grupos | ✅ |
| 2 | `/` | POST | Criar grupo | ✅ |
| 3 | `/:groupId` | GET | Metadados do grupo | ✅ |
| 4 | `/:groupId` | DELETE | Sair do grupo | ✅ |
| 5 | `/:groupId/participants` | POST | Adicionar participantes | ✅ |
| 6 | `/:groupId/participants` | DELETE | Remover participantes | ✅ |
| 7 | `/:groupId/participants/promote` | POST | Promover a admin | ✅ |
| 8 | `/:groupId/participants/demote` | POST | Rebaixar de admin | ✅ |
| 9 | `/:groupId/subject` | POST | Atualizar nome | ✅ |
| 10 | `/:groupId/description` | POST | Atualizar descrição | ✅ |
| 11 | `/:groupId/picture` | POST | Atualizar foto | ✅ |
| 12 | `/:groupId/picture` | GET | Obter foto | ✅ |
| 13 | `/:groupId/settings` | POST | Atualizar configurações | ✅ |
| 14 | `/:groupId/invite` | GET | Obter código convite | ✅ |
| 15 | `/:groupId/invite` | POST | Revogar código convite | ✅ |
| 16 | `/invite` | POST | Aceitar convite | ✅ |
| 17 | `/invite/:code` | GET | Info do convite | ✅ |
| 18 | `/:groupId/join-requests` | GET | Listar solicitações | ✅ |
| 19 | `/:groupId/join-requests` | POST | Aprovar/rejeitar solicitação | ✅ |
| 20 | `/:groupId/member-add-mode` | POST | Config modo de adição | ✅ |
| 21 | `/:groupId/join-approval-mode` | POST | Config aprovação | ✅ |
| 22 | `/invite/v4` | POST | Aceitar convite V4 | ✅ |
| 23 | `/:groupId/ephemeral` | POST | Mensagens temporárias | ✅ |

**Total: 23 endpoints**

---

## 5. CONTACTS (`/sessions/:sessionId/contacts`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/` | GET | Listar contatos | ✅ |
| 2 | `/` | POST | Criar/atualizar contato | ✅ |
| 3 | `/:jid` | DELETE | Remover contato | ✅ |
| 4 | `/validate` | POST | Validar números no WhatsApp | ✅ |
| 5 | `/business/:jid` | GET | Perfil de negócio | ✅ |
| 6 | `/sync` | POST | Sincronizar contatos | ✅ |

**Total: 6 endpoints**

---

## 6. PROFILE (`/sessions/:sessionId/profile`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/` | GET | Obter perfil próprio | ✅ |
| 2 | `/status/:jid` | GET | Status de um contato | ✅ |
| 3 | `/status` | PUT | Atualizar status | ✅ |
| 4 | `/name` | PUT | Atualizar nome | ✅ |
| 5 | `/picture/:jid` | GET | Obter foto de perfil | ✅ |
| 6 | `/picture` | PUT | Atualizar foto | ✅ |
| 7 | `/picture/remove` | PUT | Remover foto | ✅ |
| 8 | `/block` | POST | Bloquear usuário | ✅ |
| 9 | `/unblock` | POST | Desbloquear usuário | ✅ |
| 10 | `/blocklist` | GET | Lista de bloqueados | ✅ |

**Total: 10 endpoints**

---

## 7. PRESENCE (`/sessions/:sessionId/presence`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/update` | POST | Atualizar presença (online/typing) | ✅ |
| 2 | `/subscribe` | POST | Inscrever em atualizações | ✅ |
| 3 | `/cache` | GET | Obter cache de presenças | ✅ |

**Total: 3 endpoints**

---

## 8. MEDIA (`/sessions/:sessionId/media`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/download` | POST | Download de mídia | ✅ |
| 2 | `/update` | POST | Re-upload de mídia | ✅ |
| 3 | `/upload` | POST | Upload direto para servidor WA | ✅ |

**Total: 3 endpoints**

---

## 9. SETTINGS (`/sessions/:sessionId/settings`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/` | POST | Atualizar configurações | ✅ |
| 2 | `/` | GET | Obter configurações | ✅ |
| 3 | `/privacy` | GET | Obter configurações de privacidade | ✅ |

**Total: 3 endpoints**

---

## 10. CALLS (`/sessions/:sessionId/calls`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/link` | POST | Criar link de chamada | ✅ |
| 2 | `/reject` | POST | Rejeitar chamada | ✅ |

**Total: 2 endpoints**

---

## 11. BUSINESS (`/sessions/:sessionId/business`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/catalog` | GET | Obter catálogo | ✅ |
| 2 | `/collections` | GET | Obter coleções | ✅ |
| 3 | `/orders/:orderId` | GET | Detalhes do pedido | ✅ |
| 4 | `/products` | POST | Criar produto | ✅ |
| 5 | `/products/:productId` | PUT | Atualizar produto | ✅ |
| 6 | `/products` | DELETE | Deletar produtos | ✅ |
| 7 | `/profile/:jid` | GET | Perfil de negócio | ✅ |

**Total: 7 endpoints**

---

## 12. LABELS (`/sessions/:sessionId/labels`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/` | POST | Criar label | ✅ |
| 2 | `/chat` | POST | Adicionar label ao chat | ✅ |
| 3 | `/chat` | DELETE | Remover label do chat | ✅ |
| 4 | `/message` | POST | Adicionar label à mensagem | ✅ |
| 5 | `/message` | DELETE | Remover label da mensagem | ✅ |

**Total: 5 endpoints**

---

## 13. NEWSLETTERS/CHANNELS (`/sessions/:sessionId/newsletters`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/` | POST | Criar canal | ✅ |
| 2 | `/:jid` | GET | Metadados do canal | ✅ |
| 3 | `/:jid/follow` | POST | Seguir canal | ✅ |
| 4 | `/:jid/unfollow` | POST | Deixar de seguir | ✅ |
| 5 | `/:jid/mute` | POST | Silenciar canal | ✅ |
| 6 | `/:jid/unmute` | POST | Dessilenciar | ✅ |
| 7 | `/:jid/name` | PUT | Atualizar nome | ✅ |
| 8 | `/:jid/description` | PUT | Atualizar descrição | ✅ |
| 9 | `/:jid/picture` | PUT | Atualizar foto | ✅ |
| 10 | `/:jid/picture` | DELETE | Remover foto | ✅ |
| 11 | `/:jid/messages` | POST | Buscar mensagens | ✅ |
| 12 | `/:jid` | DELETE | Deletar canal | ✅ |
| 13 | `/:jid/admins` | GET | Contar admins | ✅ |
| 14 | `/:jid/subscribers` | GET | Obter inscritos | ✅ |
| 15 | `/:jid/react` | POST | Reagir a mensagem | ✅ |

**Total: 15 endpoints**

---

## 14. COMMUNITIES (`/sessions/:sessionId/communities`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/` | POST | Criar comunidade | ✅ |
| 2 | `/:jid` | GET | Metadados | ✅ |
| 3 | `/:jid` | DELETE | Sair da comunidade | ✅ |
| 4 | `/:jid/groups` | POST | Criar grupo na comunidade | ✅ |
| 5 | `/:jid/linked-groups` | GET | Listar grupos vinculados | ✅ |
| 6 | `/:jid/link-groups` | POST | Vincular grupos | ✅ |
| 7 | `/:jid/unlink-groups` | POST | Desvincular grupos | ✅ |
| 8 | `/:jid/subject` | PUT | Atualizar nome | ✅ |
| 9 | `/:jid/description` | PUT | Atualizar descrição | ✅ |
| 10 | `/:jid/invite` | GET | Obter código convite | ✅ |
| 11 | `/invite` | POST | Aceitar convite | ✅ |
| 12 | `/:jid/invite/revoke` | POST | Revogar convite | ✅ |
| 13 | `/:jid/deactivate` | POST | Desativar comunidade | ✅ |

**Total: 13 endpoints**

---

## 15. WEBHOOKS (`/session/:sessionId/webhook`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/set` | POST | Configurar webhook | ✅ |
| 2 | `/find` | GET | Buscar configuração | ✅ |
| 3 | `/events` | GET | Listar eventos disponíveis | ✅ |
| 4 | `/test` | POST | Testar webhook | ✅ |

**Total: 4 endpoints**

---

## 16. CHATWOOT (`/session/:sessionId/chatwoot`)

| # | Endpoint | Método | Descrição | Status |
|---|----------|--------|-----------|--------|
| 1 | `/set` | POST | Configurar integração | ✅ |
| 2 | `/find` | GET | Buscar configuração | ✅ |
| 3 | `/` | DELETE | Remover configuração | ✅ |
| 4 | `/webhook/:sessionId` | POST | Webhook Chatwoot (público) | ✅ |
| 5 | `/receive/:sessionId` | POST | Receber eventos zpwoot (público) | ✅ |

**Total: 5 endpoints**

---

## EVENTOS PROCESSADOS (ev.process)

| # | Evento | Handler | Status |
|---|--------|---------|--------|
| 1 | `connection.update` | ConnectionHandler | ✅ |
| 2 | `creds.update` | ConnectionHandler | ✅ |
| 3 | `messages.upsert` | MessagesHandler | ✅ |
| 4 | `messages.update` | MessagesHandler | ✅ |
| 5 | `messages.delete` | MessagesHandler | ✅ |
| 6 | `messages.reaction` | MessagesHandler | ✅ |
| 7 | `message-receipt.update` | MessagesHandler | ✅ |
| 8 | `messages.media-update` | MessagesHandler | ✅ |
| 9 | `chats.upsert` | ChatsHandler | ✅ |
| 10 | `chats.update` | ChatsHandler | ✅ |
| 11 | `chats.delete` | ChatsHandler | ✅ |
| 12 | `messaging-history.set` | HistoryHandler | ✅ |
| 13 | `contacts.upsert` | ContactsHandler | ✅ |
| 14 | `contacts.update` | ContactsHandler | ✅ |
| 15 | `groups.upsert` | GroupsPersistenceHandler | ✅ |
| 16 | `groups.update` | GroupsPersistenceHandler | ✅ |
| 17 | `group-participants.update` | GroupsPersistenceHandler | ✅ |
| 18 | `presence.update` | PresenceHandler | ✅ |
| 19 | `call` | CallsHandler | ✅ |
| 20 | `blocklist.set` | BlocklistHandler | ✅ |
| 21 | `blocklist.update` | BlocklistHandler | ✅ |
| 22 | `labels.edit` | LabelsHandler | ✅ |
| 23 | `labels.association` | LabelsHandler | ✅ |
| 24 | `group.join-request` | GroupsExtendedHandler | ✅ |
| 25 | `lid-mapping.update` | MiscHandler | ✅ |
| 26 | `newsletter.reaction` | NewsletterHandler | ✅ |
| 27 | `newsletter.view` | NewsletterHandler | ✅ |
| 28 | `newsletter-participants.update` | NewsletterHandler | ✅ |
| 29 | `newsletter-settings.update` | NewsletterHandler | ✅ |

**Total: 29 eventos**

---

## MODELOS DE BANCO DE DADOS (Prisma)

| # | Model | Descrição | Status |
|---|-------|-----------|--------|
| 1 | Session | Sessões WhatsApp | ✅ |
| 2 | AuthState | Estado de autenticação | ✅ |
| 3 | Webhook | Configurações de webhook | ✅ |
| 4 | Contact | Contatos | ✅ |
| 5 | Chat | Chats/Conversas | ✅ |
| 6 | Message | Mensagens | ✅ |
| 7 | MessageStatusHistory | Histórico de status | ✅ |
| 8 | MessageReaction | Reações a mensagens | ✅ |
| 9 | SessionSettings | Configurações da sessão | ✅ |
| 10 | Chatwoot | Integração Chatwoot | ✅ |
| 11 | Proxy | Configurações de proxy | ✅ |
| 12 | Group | Grupos WhatsApp | ✅ |
| 13 | Call | Chamadas | ✅ |

**Total: 13 models**

---

## HANDLERS DE EVENTOS

| # | Handler | Arquivo | Status |
|---|---------|---------|--------|
| 1 | ConnectionHandler | connection.handler.ts | ✅ |
| 2 | MessagesHandler | messages.handler.ts | ✅ |
| 3 | ChatsHandler | chats.handler.ts | ✅ |
| 4 | HistoryHandler | history.handler.ts | ✅ |
| 5 | ContactsHandler | contacts.handler.ts | ✅ |
| 6 | GroupsPersistenceHandler | groups-persistence.handler.ts | ✅ |
| 7 | CallsHandler | calls.handler.ts | ✅ |
| 8 | PresenceHandler | presence.handler.ts | ✅ |
| 9 | BlocklistHandler | blocklist.handler.ts | ✅ |
| 10 | LabelsHandler | labels.handler.ts | ✅ |
| 11 | GroupsExtendedHandler | groups-extended.handler.ts | ✅ |
| 12 | NewsletterHandler | newsletter.handler.ts | ✅ |
| 13 | MiscHandler | misc.handler.ts | ✅ |

**Total: 13 handlers**

---

## RESUMO GERAL

| Categoria | Quantidade |
|-----------|------------|
| **API Endpoints** | **145** |
| **Eventos Processados** | **29** |
| **Models Prisma** | **13** |
| **Handlers** | **13** |
| **Módulos API** | **16** |

### Cobertura
- ✅ 100% dos métodos essenciais do Whaileys/Baileys
- ✅ 100% dos eventos principais processados
- ✅ Integração completa com Chatwoot
- ✅ Sistema de webhooks para todos eventos
- ✅ Persistência completa de dados
- ✅ Suporte a múltiplas sessões

---

*Documento gerado automaticamente - Zpwoot WhatsApp API v0.0.1*
