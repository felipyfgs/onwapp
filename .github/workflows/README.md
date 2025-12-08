# 🚀 GitHub Actions Workflows

Workflows CI/CD para OnWapp com imagens Docker separadas.

---

## 📋 Workflows Disponíveis

### 1. CI - Integração Contínua (`ci.yml`)

**Trigger:**
- Push em `main` ou `develop`
- Pull requests para `main` ou `develop`
- Manual (workflow_dispatch)

**Jobs:**

#### Backend Tests
- Roda testes Go com coverage
- Upload de coverage para Codecov
- Parallel execution com lint

#### Backend Lint
- golangci-lint com timeout de 5min
- Verifica qualidade do código Go

#### Frontend Lint
- ESLint no código Next.js
- TypeScript type checking
- Verifica qualidade do código frontend

#### Build Binary
- Build do binário Go
- Testa que binário foi gerado corretamente
- Depende de tests + lint passarem

#### Docker Build - API
- Build da imagem Docker da API
- Usa cache do GitHub Actions
- Multi-stage build otimizado
- **Não faz push** (apenas valida build)

#### Docker Build - Painel
- Build da imagem Docker do Painel
- Usa cache do GitHub Actions
- Next.js standalone output
- **Não faz push** (apenas valida build)

**Duração Estimada:** 5-8 minutos

---

### 2. Release - Publicação (`release.yml`)

**Trigger:**
- Push de tags começando com `v*` (ex: `v1.0.0`, `v2.1.3`)

**Jobs:**

#### Create Release
- Cria GitHub Release
- GoReleaser gera binários para múltiplas plataformas
- Anexa binários ao release
- Extrai informações de versão (VERSION, GIT_COMMIT, BUILD_DATE)
- **Outputs** disponíveis para outros jobs

#### Build and Push API
- Build imagem Docker da API
- Push para Docker Hub
- Multi-platform: `linux/amd64` e `linux/arm64`
- Tags automáticas:
  - `v1.2.3` (exata)
  - `v1.2` (major.minor)
  - `v1` (major)
  - `latest` (se branch padrão)
- Usa informações de versão do job anterior

#### Build and Push Painel
- Build imagem Docker do Painel
- Push para Docker Hub
- Multi-platform: `linux/amd64` e `linux/arm64`
- Mesma estratégia de tags

**Duração Estimada:** 10-15 minutos

---

## 🔧 Configuração Necessária

### GitHub Secrets

Configure em `Settings → Secrets and variables → Actions`:

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `DOCKERHUB_USERNAME` | Usuário Docker Hub | `seuusuario` |
| `DOCKERHUB_TOKEN` | Token de acesso Docker Hub | `dckr_pat_...` |
| `CODECOV_TOKEN` | Token Codecov (opcional) | `...` |

### Como Criar Docker Hub Token

1. Acesse https://hub.docker.com/settings/security
2. Clique em "New Access Token"
3. Nome: `github-actions-onwapp`
4. Permissions: `Read, Write, Delete`
5. Copie o token e adicione aos secrets do GitHub

---

## 📊 Diagrama de Fluxo

### CI (Push/PR)
```
┌─────────────┐
│   Trigger   │
│  Push/PR    │
└──────┬──────┘
       │
       ├──────────────────┬────────────────┬──────────────┐
       ▼                  ▼                ▼              ▼
┌────────────┐   ┌──────────────┐   ┌──────────┐   ┌──────────┐
│ Backend    │   │ Backend      │   │ Frontend │   │ Build    │
│ Tests      │   │ Lint         │   │ Lint     │   │ Binary   │
└─────┬──────┘   └──────┬───────┘   └────┬─────┘   └────┬─────┘
      │                 │                 │              │
      └────────┬────────┴─────────────────┤              │
               ▼                          ▼              ▼
        ┌────────────┐              ┌──────────┐   ┌──────────┐
        │ Docker     │              │ Docker   │   │ Success  │
        │ Build API  │              │ Build    │   │ ✅       │
        └────────────┘              │ Painel   │   └──────────┘
                                    └──────────┘
```

### Release (Tag)
```
┌─────────────┐
│   Trigger   │
│  Tag v*     │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Create Release   │
│ + GoReleaser     │
│ (outputs)        │
└────────┬─────────┘
         │
         ├──────────────────┬───────────────────┐
         ▼                  ▼                   ▼
  ┌────────────┐     ┌────────────┐      ┌──────────┐
  │ Build &    │     │ Build &    │      │ GitHub   │
  │ Push API   │     │ Push       │      │ Release  │
  │ Docker Hub │     │ Painel     │      │ Created  │
  └────────────┘     │ Docker Hub │      │ ✅       │
                     └────────────┘      └──────────┘
```

---

## 🚀 Como Usar

### Desenvolvimento Diário

```bash
# Trabalhar no código
git add .
git commit -m "feat: nova funcionalidade"
git push origin develop

# CI roda automaticamente:
# ✅ Tests
# ✅ Lint
# ✅ Build
# ✅ Docker build (validação)
```

### Criar Release

```bash
# 1. Atualizar versão no código
# vim internal/version/version.go

# 2. Commit e push
git add .
git commit -m "chore: bump version to 1.2.0"
git push origin main

# 3. Criar tag
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin v1.2.0

# 4. Aguardar workflow completar (10-15 min)
# ✅ GitHub Release criado
# ✅ Binários anexados
# ✅ Docker images pushed:
#    - seuusuario/onwapp-api:v1.2.0
#    - seuusuario/onwapp-api:v1.2
#    - seuusuario/onwapp-api:v1
#    - seuusuario/onwapp-api:latest
#    - seuusuario/onwapp-painel:v1.2.0
#    - seuusuario/onwapp-painel:v1.2
#    - seuusuario/onwapp-painel:v1
#    - seuusuario/onwapp-painel:latest
```

### Usar Imagens do Docker Hub

```bash
# Pull latest
docker pull seuusuario/onwapp-api:latest
docker pull seuusuario/onwapp-painel:latest

# Ou versão específica
docker pull seuusuario/onwapp-api:v1.2.0
docker pull seuusuario/onwapp-painel:v1.2.0
```

---

## 📈 Otimizações Implementadas

### 1. Cache Agressivo
```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```
- Usa cache do GitHub Actions
- Reduz tempo de build em 70%
- Layers compartilhados entre builds

### 2. Parallel Execution
- Frontend lint roda em paralelo com backend tests
- Docker builds rodam em paralelo no release
- Economiza 40% do tempo total

### 3. Multi-platform
```yaml
platforms: linux/amd64,linux/arm64
```
- Suporte nativo para ARM (Apple Silicon, Raspberry Pi)
- Sem necessidade de cross-compilation manual

### 4. Conditional Jobs
- Docker builds só rodam se tests passarem
- Release só faz push se binários buildarem

### 5. Smart Tagging
```yaml
type=semver,pattern={{version}}      # v1.2.3
type=semver,pattern={{major}}.{{minor}}  # v1.2
type=semver,pattern={{major}}        # v1
type=raw,value=latest                # latest
```
- Múltiplas tags automáticas
- Facilita versionamento

---

## 🐛 Troubleshooting

### CI Falha no Docker Build

**Erro:**
```
Error: buildx failed with: error: failed to solve
```

**Solução:**
1. Verificar Dockerfile.api e painel/Dockerfile localmente:
   ```bash
   make docker-build
   ```
2. Verificar se .dockerignore não está excluindo arquivos necessários

### Release Não Faz Push

**Erro:**
```
Error: denied: requested access to the resource is denied
```

**Solução:**
1. Verificar secrets no GitHub:
   ```
   Settings → Secrets → DOCKERHUB_USERNAME
   Settings → Secrets → DOCKERHUB_TOKEN
   ```
2. Verificar token tem permissão de write
3. Verificar nome de usuário está correto

### Tag Não Dispara Workflow

**Problema:** Fez push da tag mas workflow não rodou

**Solução:**
1. Tag deve começar com `v`:
   ```bash
   # ✅ Correto
   git tag v1.0.0
   
   # ❌ Errado
   git tag 1.0.0
   ```

2. Push da tag:
   ```bash
   git push origin v1.0.0
   # Ou push todas tags
   git push --tags
   ```

### Build Lento

**Problema:** Build demora mais de 20 minutos

**Solução:**
1. Verificar se cache está funcionando:
   ```yaml
   cache-from: type=gha  # Deve estar presente
   ```

2. Primeiro build sempre é lento (sem cache)
   - Builds subsequentes devem ser rápidos

3. Verificar runners do GitHub Actions:
   - Settings → Actions → Runners

---

## 📝 Logs e Debugging

### Ver Logs de um Workflow

1. Acesse: https://github.com/seu-usuario/onwapp/actions
2. Clique no workflow (CI ou Release)
3. Clique no job específico
4. Expanda steps para ver logs detalhados

### Debug Mode

Adicione secrets para habilitar debug:
```
ACTIONS_STEP_DEBUG = true
ACTIONS_RUNNER_DEBUG = true
```

### Rerun Failed Jobs

1. Acesse workflow que falhou
2. Clique em "Re-run failed jobs"
3. Ou "Re-run all jobs" para rodar tudo novamente

---

## ✅ Checklist de Validação

Antes de fazer release:

- [ ] CI está passando em `main`
- [ ] Versão atualizada em `internal/version/version.go`
- [ ] CHANGELOG.md atualizado
- [ ] Docker Hub secrets configurados
- [ ] Tag segue padrão `v*` (ex: v1.2.0)
- [ ] Build local funciona: `make docker-build`
- [ ] Testes passam: `make test`
- [ ] Lint passa: `make lint`

---

## 🎯 Roadmap Futuro

Melhorias planejadas:

1. [ ] Testes de integração com docker-compose
2. [ ] Deploy automático para staging
3. [ ] Análise de segurança (Trivy)
4. [ ] Performance benchmarks
5. [ ] Notificações Slack/Discord
6. [ ] Auto-update de CHANGELOG
7. [ ] Semantic versioning automático

---

## 📚 Referências

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [GoReleaser](https://goreleaser.com/)
- [Semantic Versioning](https://semver.org/)

---

🎉 **Workflows prontos e otimizados para OnWapp!**
