# Índice de Documentação - Investigação Whaileys

## Visão Geral

Esta pasta contém uma investigação completa da biblioteca **whaileys** (fork estável do Baileys), focada em:
1. Eventos de sincronização de histórico
2. Estrutura de dados de eventos
3. Tipos e interfaces disponíveis
4. Eventos não capturados atualmente

---

## Documentos Disponíveis

### 1. **WHAILEYS_INVESTIGATION.md** (Principal - Técnico)
- **Tamanho:** ~18 KB | ~530 linhas
- **Conteúdo:**
  - Resumo executivo completo
  - Lista detalhada de todos os 31 eventos
  - Estrutura completa de cada tipo de evento
  - Payload e tipos de sincronização
  - Comparação de eventos (set vs upsert vs update)
  - Estrutura interna de buffering
  - Recomendações técnicas detalhadas
  - Arquivos-chave no whaileys e zpwoot

- **Para quem:** Desenvolvedores que precisam implementar novos handlers de eventos

**Seções principais:**
- [x] 1. Lista completa de eventos (31)
- [x] 2. Estrutura detalhada dos eventos
- [x] 3. Sincronização AppState
- [x] 4. Eventos capturados vs não capturados
- [x] 5. Como processar messaging-history.set
- [x] 6. Campos importantes não persistidos
- [x] 7. Tipos de sincronização
- [x] 8. Estrutura de buffering
- [x] 9. Comparação set vs upsert vs update
- [x] 10. Recomendações de implementação
- [x] 11. Arquivo de referência rápida
- [x] 12. Resumo final

---

### 2. **WHAILEYS_SUMMARY.txt** (Sumário - Estruturado)
- **Tamanho:** ~12 KB | ~272 linhas
- **Conteúdo:**
  - Estatísticas gerais
  - Lista completa de eventos (31) com status
  - Estrutura de dados crítica
  - Evento crítico: messaging-history.set
  - Campos não persistidos
  - Arquivos-chave
  - Estatísticas de cobertura
  - Recomendações por prioridade
  - Conclusão

- **Para quem:** Gerentes de projeto, arquitetos que precisam de visão geral rápida

**Ideal para:**
- Status meeting (5 min de leitura)
- Planning de sprints (quais eventos implementar)
- Relatório de cobertura

---

### 3. **WHAILEYS_EVENTS_REFERENCE.json** (Referência - Estruturada)
- **Tamanho:** ~12 KB | ~393 linhas
- **Conteúdo:**
  - Todos os 31 eventos em formato JSON
  - Status de implementação de cada um
  - Payload de cada evento
  - Campos persistidos vs não persistidos
  - Tipos de dados e estruturas
  - Links para arquivos-fonte
  - Matriz de prioridades P0/P1/P2

- **Para quem:** Programadores, ferramentas automatizadas, checklist

**Ideal para:**
- Queries/buscas programáticas
- Gerar checklists
- Integrar com ferramentas de tracking
- Comparações estruturadas

---

### 4. **WHAILEYS_INDEX.md** (Este arquivo)
- Guia de navegação entre documentos
- Resumo de conteúdo de cada um
- Como usar os documentos

---

## Quick Reference

### Evento Crítico Faltando
**`messaging-history.set`**
- Status: NÃO IMPLEMENTADO
- Criticidade: P0 (Bloqueante)
- Impacto: Sem sincronização de histórico na primeira conexão
- Payload:
  ```typescript
  {
    chats: Chat[];
    contacts: Contact[];
    messages: WAMessage[];
    isLatest: boolean;
    progress?: number;
    syncType?: HistorySyncType;
  }
  ```

### Eventos Implementados (8)
- ✓ messages.upsert
- ✓ messages.update
- ✓ messages.delete
- ✓ message-receipt.update
- ✓ chats.upsert
- ✓ chats.update
- ✓ contacts.upsert
- ✓ contacts.update

### Taxa de Cobertura
- **Atual:** 35% (8+6 de 31)
- **Pós P0+P1:** ~70% (26 de 31)

---

## Como Usar Estes Documentos

### Cenário 1: "Preciso entender tudo sobre eventos"
1. Leia: `WHAILEYS_INVESTIGATION.md`
2. Consulte: `WHAILEYS_EVENTS_REFERENCE.json` (para detalhes específicos)

### Cenário 2: "Preciso de status para a reunião de sprint"
1. Leia: `WHAILEYS_SUMMARY.txt` (5 min)
2. Use seção "Recomendações por Prioridade"

### Cenário 3: "Vou implementar o evento X"
1. Procure em `WHAILEYS_EVENTS_REFERENCE.json`
2. Leia seção correspondente em `WHAILEYS_INVESTIGATION.md`
3. Consulte arquivos-fonte no whaileys

### Cenário 4: "Preciso criar checklist de implementação"
1. Use `WHAILEYS_EVENTS_REFERENCE.json`
2. Organize por prioridade (P0, P1, P2)
3. Marque status conforme implementar

---

## Estrutura de Eventos por Categoria

| Categoria | Total | Impl. | Parcial | Faltando | % |
|-----------|-------|-------|---------|----------|---|
| Histórico | 1 | 0 | 0 | 1 | 0% |
| Mensagens | 7 | 4 | 0 | 3 | 57% |
| Chats | 4 | 2 | 1 | 1 | 50% |
| Contatos | 3 | 2 | 0 | 1 | 67% |
| Grupos | 3 | 0 | 2 | 1 | 0% |
| Conexão | 2 | 0 | 2 | 0 | 0% |
| Presença | 1 | 0 | 1 | 0 | 0% |
| Bloqueio | 2 | 0 | 0 | 2 | 0% |
| Chamadas | 1 | 0 | 1 | 0 | 17% |
| **TOTAL** | **31** | **8** | **6** | **17** | **35%** |

---

## Roadmap Recomendado

### Fase 1 (CRÍTICO) - Sprint imediata
- [ ] Implementar `messaging-history.set`
- [ ] Handler completo com persistência em batch
- [ ] Suportar chunks via `progress` field

### Fase 2 (ALTA) - Próxima sprint
- [ ] Estender `chats.update` (archived, pinned, mute, ephemeral)
- [ ] Estender `contacts.update` (lid, verifiedName, status)
- [ ] Implementar `messages.media-update`
- [ ] Implementar `messages.reaction`
- [ ] Implementar `blocklist.set/update`

### Fase 3 (MÉDIA) - Backlog
- [ ] `group-participants.update`
- [ ] `chats.phoneNumberShare`
- [ ] `contacts.phone-number-share`
- [ ] `messages.pdo-response`
- [ ] Melhorar `call` event
- [ ] Melhorar `connection.update`

---

## Arquivos-Chave no Código

### whaileys (node_modules)
```
/root/zpwoot/node_modules/whaileys/lib/
├── Types/
│   ├── Events.d.ts           ← Definição de todos os 31 eventos (linhas 10-99)
│   ├── Contact.d.ts
│   ├── Chat.d.ts
│   └── Message.d.ts
├── Socket/
│   ├── chats.js              ← AppState sync (linha 313+)
│   ├── messages-recv.js      ← Recebimento de eventos
│   └── index.d.ts
└── Utils/
    ├── process-message.js    ← HISTORY_SYNC_NOTIFICATION (linhas 103-131)
    ├── chat-utils.js         ← processSyncAction() (linhas 529-670)
    └── history.js            ← Sincronização de histórico
```

### zpwoot (projeto)
```
/root/zpwoot/src/
├── whatsapp/
│   └── whatsapp.service.ts   ← Listeners de eventos (linha 288)
├── webhooks/
│   └── validators/
│       └── is-valid-event.validator.ts  ← VALID_WEBHOOK_EVENTS (já contém todos!)
└── persistence/
    └── persistence.service.ts ← Armazenamento
```

---

## Campos Não Persistidos

### Chat
```typescript
{
  archived?: boolean;                    // ✗ Não persistido
  pinned?: boolean;                      // ✗ Não persistido
  mute?: { endTimestamp: number };       // ✗ Não persistido
  ephemeralExpiration?: number;          // ✗ Não persistido
  readOnly?: boolean;                    // ✗ Não persistido
}
```

### Contact
```typescript
{
  lid?: string;                          // ✗ Não persistido
  verifiedName?: string;                 // ✗ Não persistido
  status?: string;                       // ✗ Não persistido
}
```

### Message
```typescript
{
  status?: number;                       // ✗ Não persistido (0-4: pending→failed)
  broadcast?: boolean;                   // ✗ Não persistido
  messageStubType?: number;              // ✗ Não persistido
  retryCount?: number;                   // ✗ Não persistido
}
```

---

## Perguntas Frequentes

### P: Onde está o evento "chats.set"?
**R:** Não existe. O equivalente é `messaging-history.set` que sincroniza tudo de uma vez.

### P: Por que messaging-history.set não está implementado?
**R:** Falta handler no `whatsapp.service.ts`. O evento já é emitido pelo whaileys, só precisa ser capturado.

### P: Quantos campos estão faltando ser persistidos?
**R:** Aproximadamente 15+ campos em Chat, Contact e Message.

### P: Qual evento implemento primeiro?
**R:** `messaging-history.set` (P0). É crítico para sincronização inicial.

### P: Qual é a taxa atual de cobertura?
**R:** 35% (8 de 31 eventos completamente implementados).

### P: Quanto aumenta a cobertura se implementar P0+P1?
**R:** ~70% (26 de 31 eventos).

---

## Notas Importantes

1. **VALID_WEBHOOK_EVENTS já contém todos os 31 eventos** em `/root/zpwoot/src/webhooks/validators/is-valid-event.validator.ts`
   - Isso significa que o suporte a webhooks já está pronto
   - Falta apenas implementar os handlers dos eventos

2. **messaging-history.set pode vir em chunks**
   - Use o campo `progress` (0-100) para rastrear
   - Cada chunk pode ter `chats[]`, `contacts[]`, `messages[]`
   - Combine com `isLatest` para saber quando terminou

3. **Os dados vêm em reverse-chronological order**
   - Mensagens: mais recentes primeiro
   - Chats: ordem de última atividade
   - Importante para UI e cache

4. **Não misture tipos de sincronização**
   - INITIAL_BOOTSTRAP: primeira vez (histórico completo)
   - RECENT: atualizações incrementais (não usar para init)
   - FULL: força sincronização completa
   - ON_DEMAND: carregamento sob demanda

---

## Contato / Próximos Passos

1. Revisar `WHAILEYS_INVESTIGATION.md` para detalhes técnicos
2. Executar checklist de implementação usando `WHAILEYS_EVENTS_REFERENCE.json`
3. Priorizar em ordem: P0 → P1 → P2
4. Testar cada evento com logs estruturados

---

**Data da investigação:** 2025-11-23  
**Biblioteca:** whaileys (fork estável do Baileys)  
**Versão do projeto:** Baseado em commit 8777629

