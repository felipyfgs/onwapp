# Analise de Rotas - ZPWoot API

## Resumo Executivo

Esta analise identifica problemas de arquitetura, rotas duplicadas, arquivos orfaos e inconsistencias de nomenclatura no projeto ZPWoot.

---

## 1. ARQUIVOS ORFAOS (NAO UTILIZADOS)

### 1.1 `internal/api/handler/poll.go`

**Status:** :warning: NAO UTILIZADO

**Problema:** Este arquivo define `PollHandler` com metodos `SendPoll` e `SendPollVote`, mas esses handlers **nunca sao instanciados** no `main.go` e **nao estao registrados** no `router.go`.

**Duplicacao:** A mesma funcionalidade foi implementada em `message.go`:
- `message.go:413` - SendPoll
- `message.go:449` - SendPollVote

**Recomendacao:** 
- **REMOVER** o arquivo `poll.go`
- Manter a implementacao em `message.go` (ja esta funcionando)

```go
// poll.go - ARQUIVO ORFAO
type PollHandler struct { ... }  // Nunca instanciado
func NewPollHandler(...) { ... } // Nunca chamado
```

---

### 1.2 `internal/api/handler/blocklist.go`

**Status:** :warning: NAO UTILIZADO

**Problema:** Este arquivo define `BlocklistHandler` com metodos `GetBlocklist` e `UpdateBlocklist`, mas esses handlers **nunca sao instanciados** no `main.go`.

**Duplicacao:** A mesma funcionalidade foi implementada em `contact.go`:
- `contact.go:288` - GetBlocklist  
- `contact.go:321` - UpdateBlocklist

**Recomendacao:**
- **REMOVER** o arquivo `blocklist.go`
- Manter a implementacao em `contact.go` (ja esta funcionando)

---

## 2. INCONSISTENCIAS DE NOMENCLATURA

### 2.1 Rota de Blocklist Fora do Padrao

| Atual | Esperado | Motivo |
|-------|----------|--------|
| `GET /sessions/{name}/blocklist` | `GET /sessions/{name}/contact/blocklist` | Blocklist e relacionado a contatos |
| `POST /sessions/{name}/blocklist` | `POST /sessions/{name}/contact/blocklist` | Consistencia com outras rotas de contact |

**Problema:** A rota `/blocklist` esta no nivel raiz da sessao, mas conceitualmente pertence ao dominio de `contact`.

---

### 2.2 Envio de Mensagem para Grupo

| Atual | Sugerido | Motivo |
|-------|----------|--------|
| `POST /group/send/text` | `POST /send/group/text` | Padrao: `/send/{tipo}` |

**Alternativa:** Manter como esta, pois agrupa logicamente as operacoes de grupo.

---

### 2.3 Nomenclatura Confusa: Status vs Profile/Status

| Rota | Funcao |
|------|--------|
| `POST /sessions/{name}/status` | Postar status/story (visivel para contatos) |
| `PUT /sessions/{name}/profile/status` | Definir mensagem de status do perfil ("Hey there!") |

**Problema:** Ambas usam "status" mas fazem coisas diferentes.

**Recomendacao:**
- Renomear `POST /status` para `POST /story` ou `POST /status/post`
- Manter `PUT /profile/status` para a mensagem de perfil

---

## 3. INCONSISTENCIAS REST

### 3.1 Metodo HTTP Incorreto

| Rota | Metodo Atual | Metodo Correto | Motivo |
|------|--------------|----------------|--------|
| `/group/info/link` | POST | GET | Apenas obtem informacao, nao modifica |

**Codigo atual:**
```go
// group.go - GetGroupInfoFromLink
// @Router /sessions/{name}/group/info/link [post]  // ERRADO
```

**Deveria ser:**
```go
// @Router /sessions/{name}/group/info/link [get]   // CORRETO
// Ou melhor: GET /sessions/{name}/group/link/{code}/info
```

---

### 3.2 Parametros de Path Inconsistentes

| Padrao 1 | Padrao 2 | Problema |
|----------|----------|----------|
| `/:groupId/info` | `/info/link` | Inconsistencia na posicao do recurso |
| `/:groupId/requests` | `/requests` (body) | Alguns usam path, outros body |

---

## 4. ROTAS POTENCIALMENTE REDUNDANTES

### 4.1 Presenca de Chat

| Rota | Funcao |
|------|--------|
| `POST /contact/presence` | Define presenca online/offline |
| `POST /contact/typing` | Define estado de digitacao |

**Analise:** Sao funcionalidades diferentes, **NAO sao redundantes**.
- `presence` = disponibilidade geral (online/offline)
- `typing` = estado de digitacao em chat especifico (composing/paused)

---

### 4.2 Rotas de Grupo com Sobreposicao

| Rota | Funcao |
|------|--------|
| `GET /group/:groupId/requests` | Lista solicitacoes por groupId no path |
| `POST /group/requests` | Aprova/rejeita com groupId no body |

**Problema:** Inconsistencia - um usa path param, outro usa body.

**Recomendacao:** Padronizar para:
```
GET  /group/{groupId}/requests        - Listar
POST /group/{groupId}/requests/action - Aprovar/Rejeitar
```

---

## 5. ESTRUTURA RECOMENDADA

### Handlers Ativos (Manter)
```
internal/api/handler/
├── call.go        ✅ Usado
├── chat.go        ✅ Usado
├── community.go   ✅ Usado
├── contact.go     ✅ Usado (inclui blocklist)
├── group.go       ✅ Usado
├── message.go     ✅ Usado (inclui poll)
├── newsletter.go  ✅ Usado
├── profile.go     ✅ Usado
├── session.go     ✅ Usado
├── status.go      ✅ Usado
└── webhook.go     ✅ Usado
```

### Handlers Orfaos (Remover)
```
internal/api/handler/
├── blocklist.go   ❌ REMOVER - duplicado em contact.go
└── poll.go        ❌ REMOVER - duplicado em message.go
```

---

## 6. ACOES RECOMENDADAS

### Prioridade Alta
1. [ ] Remover `poll.go` (codigo morto)
2. [ ] Remover `blocklist.go` (codigo morto)
3. [ ] Corrigir metodo HTTP de `/group/info/link` de POST para GET

### Prioridade Media
4. [ ] Mover rota `/blocklist` para `/contact/blocklist`
5. [ ] Padronizar rotas de group requests

### Prioridade Baixa
6. [ ] Renomear `POST /status` para `POST /story`
7. [ ] Documentar diferenca entre presence e typing

---

## 7. IMPACTO DA REMOCAO

### poll.go
- **Linhas de codigo:** ~90
- **Dependencias:** Nenhuma (nao e importado)
- **Impacto:** Zero - codigo nunca executado
- **Risco:** Nenhum

### blocklist.go
- **Linhas de codigo:** ~85
- **Dependencias:** Nenhuma (nao e importado)
- **Impacto:** Zero - codigo nunca executado
- **Risco:** Nenhum

---

## 8. COMANDOS PARA LIMPEZA

```bash
# Remover arquivos orfaos
rm internal/api/handler/poll.go
rm internal/api/handler/blocklist.go

# Verificar build
go build ./...

# Regenerar swagger
swag init -g cmd/zpwoot/main.go -o docs
```

---

## Conclusao

O projeto tem **2 arquivos orfaos** que devem ser removidos e **algumas inconsistencias de nomenclatura** que podem ser corrigidas para melhorar a manutencao. A funcionalidade principal esta correta e operacional.

| Metrica | Valor |
|---------|-------|
| Total de Handlers | 13 |
| Handlers Ativos | 11 |
| Handlers Orfaos | 2 |
| Rotas Duplicadas | 4 (2 pares) |
| Inconsistencias REST | 1 |
