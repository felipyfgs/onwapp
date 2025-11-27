My Plan                                                                                                                                                                        Unpin in settings │
│ ○ Implementar POST /sessions/:name/send/poll - Criar enquete (BuildPollCreation)                                                                                                                 │
│ ○ Implementar POST /sessions/:name/send/poll/vote - Votar em enquete (BuildPollVote)                                                                                                             │
│ ○ Adicionar suporte a reply/quote em todas as rotas de envio (quotedMsgId)                                                                                                                       │
│ ○ Implementar GET /sessions/:name/blocklist - Listar bloqueados (GetBlocklist)                                                                                                                   │
│ ○ Implementar POST /sessions/:name/blocklist - Bloquear/desbloquear (UpdateBlocklist)                                                                                                            │
│ ○ Implementar PUT /sessions/:name/chat/disappearing - Mensagens temporárias (SetDisappearingTimer)                                                                                               │
│ ○ Implementar PUT /sessions/:name/group/announce - Só admins enviam (SetGroupAnnounce)                                                                                                           │
│ ○ Implementar PUT /sessions/:name/group/locked - Só admins editam info (SetGroupLocked)                                                                                                          │
│ ○ Implementar PUT /sessions/:name/group/picture - Foto do grupo (SetGroupPhoto)                                                                                                                  │
│ ○ Implementar PUT /sessions/:name/group/approval - Modo aprovação (SetGroupJoinApprovalMode)                                                                                                     │
│ ○ Implementar GET /sessions/:name/group/:id/requests - Solicitações pendentes (GetGroupRequestParticipants)                                                                                      │
│ ○ Implementar POST /sessions/:name/group/:id/requests - Aprovar/rejeitar (UpdateGroupRequestParticipants)                                                                                        │
│ ○ Implementar GET /sessions/:name/group/info/link - Info do grupo pelo link (GetGroupInfoFromLink)                                                                                               │
│ ○ Implementar POST /sessions/:name/newsletter/create - Criar canal (CreateNewsletter)                                                                                                            │
│ ○ Implementar POST /sessions/:name/newsletter/follow - Seguir canal (FollowNewsletter)                                                                                                           │
│ ○ Implementar POST /sessions/:name/newsletter/unfollow - Deixar de seguir (UnfollowNewsletter)                                                                                                   │
│ ○ Implementar GET /sessions/:name/newsletter/:id/info - Info do canal (GetNewsletterInfo)                                                                                                        │
│ ○ Implementar GET /sessions/:name/newsletter/list - Listar canais seguidos (GetSubscribedNewsletters)                                                                                            │
│ ○ Implementar GET /sessions/:name/newsletter/:id/messages - Mensagens do canal (GetNewsletterMessages)                                                                                           │
│ ○ Implementar POST /sessions/:name/newsletter/reaction - Reagir em canal (NewsletterSendReaction)                                                                                                │
│ ○ Implementar POST /sessions/:name/newsletter/mute - Silenciar canal (NewsletterToggleMute)                                                                                                      │
│ ○ Implementar POST /sessions/:name/contact/subscribe - Subscrever presença (SubscribePresence)                                                                                                   │
│ ○ Implementar GET /sessions/:name/contact/qrlink - QR link do contato (GetContactQRLink)                                                                                                         │
│ ○ Implementar GET /sessions/:name/contact/:phone/business - Perfil comercial (GetBusinessProfile)                                                                                                │
│ ○ Implementar PUT /sessions/:name/profile/disappearing - Timer padrão (SetDefaultDisappearingTimer)                                                                                              │
│ ○ Implementar POST /sessions/:name/status - Postar status/story                                                                                                                                  │
│ ○ Implementar GET /sessions/:name/status/privacy - Privacidade do status (GetStatusPrivacy)                                                                                                      │
│ ○ Implementar POST /sessions/:name/call/reject - Rejeitar chamada (RejectCall)                                                                                                                   │
│ ○ Implementar PUT /sessions/:name/profile/privacy - Corrigir SetPrivacySetting (atualmente retorna erro)                                                                                         │
│ ○ Implementar POST /sessions/:name/pair/phone - Parear por telefone (PairPhone)                                                                                                                  │
│ ○ Implementar rotas de Comunidades (LinkGroup, UnlinkGroup, GetSubGroups)                                                                                                                        │
│ ○ Atualizar Swagger após implementações                                                                                                                                                          │
│ ○ Rodar build e lint final    