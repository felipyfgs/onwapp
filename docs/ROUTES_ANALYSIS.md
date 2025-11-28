# Analise de Rotas - ZPWoot API

> **STATUS: CORRIGIDO** - Todas as issues foram resolvidas em 2024-11-28

## Resumo Executivo

Esta analise identificou e **CORRIGIU** problemas de arquitetura, rotas duplicadas, arquivos orfaos e inconsistencias de nomenclatura no projeto ZPWoot.

---

## 1. ARQUIVOS ORFAOS (NAO UTILIZADOS)

### 1.1 `internal/api/handler/poll.go`

**Status:** :white_check_mark: **REMOVIDO**

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

**Status:** :white_check_mark: **REMOVIDO**

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

:white_check_mark: **CORRIGIDO**

| Antes | Depois |
|-------|--------|
| `GET /sessions/{name}/blocklist` | `GET /sessions/{name}/contact/blocklist` |
| `POST /sessions/{name}/blocklist` | `POST /sessions/{name}/contact/blocklist` |

**Solucao:** Rotas movidas para o dominio `/contact/` mantendo consistencia.

---

### 2.2 Envio de Mensagem para Grupo

| Atual | Sugerido | Motivo |
|-------|----------|--------|
| `POST /group/send/text` | `POST /send/group/text` | Padrao: `/send/{tipo}` |

**Alternativa:** Manter como esta, pois agrupa logicamente as operacoes de grupo.

---

### 2.3 Nomenclatura Confusa: Status vs Profile/Status

:white_check_mark: **CORRIGIDO**

| Antes | Depois | Funcao |
|-------|--------|--------|
| `POST /status` | `POST /story` | Postar story (visivel para contatos) |
| `PUT /profile/status` | `PUT /profile/status` | Mensagem de perfil ("Hey there!") |

**Solucao:** Renomeado `POST /status` para `POST /story` para evitar confusao.

---

## 3. INCONSISTENCIAS REST

### 3.1 Metodo HTTP Incorreto

:white_check_mark: **CORRIGIDO**

| Antes | Depois |
|-------|--------|
| `POST /group/info/link` (body) | `GET /group/info/link?link=...` (query) |

**Solucao:** Alterado de POST para GET com query parameter `link`.

---

### 3.2 Parametros de Path Inconsistentes

:white_check_mark: **CORRIGIDO**

| Antes | Depois |
|-------|--------|
| `GET /:groupId/requests` | `GET /:groupId/requests` |
| `POST /requests` (groupId no body) | `POST /:groupId/requests` (groupId no path) |

**Solucao:** Padronizado para usar `groupId` sempre no path.

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

## 6. ACOES REALIZADAS

### Prioridade Alta
1. [x] ~~Remover `poll.go` (codigo morto)~~ **FEITO**
2. [x] ~~Remover `blocklist.go` (codigo morto)~~ **FEITO**
3. [x] ~~Corrigir metodo HTTP de `/group/info/link` de POST para GET~~ **FEITO**

### Prioridade Media
4. [x] ~~Mover rota `/blocklist` para `/contact/blocklist`~~ **FEITO**
5. [x] ~~Padronizar rotas de group requests~~ **FEITO**

### Prioridade Baixa
6. [x] ~~Renomear `POST /status` para `POST /story`~~ **FEITO**
7. [x] ~~Documentar diferenca entre presence e typing~~ **NA SECAO 4.1**

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

:white_check_mark: **TODAS AS ISSUES FORAM CORRIGIDAS**

| Metrica | Antes | Depois |
|---------|-------|--------|
| Total de Handlers | 13 | 11 |
| Handlers Ativos | 11 | 11 |
| Handlers Orfaos | 2 | 0 |
| Rotas Duplicadas | 4 | 0 |
| Inconsistencias REST | 3 | 0 |

### Mudancas Realizadas

```bash
# Arquivos removidos
- internal/api/handler/poll.go
- internal/api/handler/blocklist.go

# Rotas alteradas
- /blocklist -> /contact/blocklist
- POST /group/info/link -> GET /group/info/link?link=...
- POST /group/requests -> POST /group/:groupId/requests
- POST /status -> POST /story
```
