# GitHub Actions Workflows

Workflows CI/CD para OnWapp.

---

## Workflows Disponiveis

### 1. CI - Integracao Continua (`ci.yml`)

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
- Verifica qualidade do codigo Go

#### Build Binary
- Build do binario Go
- Testa que binario foi gerado corretamente
- Depende de tests + lint passarem

#### Docker Build - API
- Build da imagem Docker da API
- Usa cache do GitHub Actions
- Multi-stage build otimizado
- **Nao faz push** (apenas valida build)

**Duracao Estimada:** 5-8 minutos

---

### 2. Release - Publicacao (`release.yml`)

**Trigger:**
- Push de tags comecando com `v*` (ex: `v1.0.0`, `v2.1.3`)

**Jobs:**

#### Create Release
- Cria GitHub Release
- GoReleaser gera binarios para multiplas plataformas
- Anexa binarios ao release
- Extrai informacoes de versao (VERSION, GIT_COMMIT, BUILD_DATE)
- **Outputs** disponiveis para outros jobs

#### Build and Push API
- Build imagem Docker da API
- Push para Docker Hub
- Multi-platform: `linux/amd64` e `linux/arm64`
- Tags automaticas:
  - `v1.2.3` (exata)
  - `v1.2` (major.minor)
  - `v1` (major)
  - `latest` (se branch padrao)
- Usa informacoes de versao do job anterior

**Duracao Estimada:** 10-15 minutos

---

## Configuracao Necessaria

### GitHub Secrets

Configure em `Settings -> Secrets and variables -> Actions`:

| Secret | Descricao | Exemplo |
|--------|-----------|---------|
| `DOCKERHUB_USERNAME` | Usuario Docker Hub | `seuusuario` |
| `DOCKERHUB_TOKEN` | Token de acesso Docker Hub | `dckr_pat_...` |
| `CODECOV_TOKEN` | Token Codecov (opcional) | `...` |

### Como Criar Docker Hub Token

1. Acesse https://hub.docker.com/settings/security
2. Clique em "New Access Token"
3. Nome: `github-actions-onwapp`
4. Permissions: `Read, Write, Delete`
5. Copie o token e adicione aos secrets do GitHub

---

## Diagrama de Fluxo

### CI (Push/PR)
```
Trigger (Push/PR)
       |
       +---> Backend Tests --+
       |                     |
       +---> Backend Lint ---+---> Docker Build API
       |                     |
       +---> Build Binary ---+
```

### Release (Tag)
```
Trigger (Tag v*)
       |
       v
Create Release + GoReleaser
       |
       v
Build & Push API (Docker Hub)
```

---

## Como Usar

### Desenvolvimento Diario

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin develop

# CI roda automaticamente:
# - Tests
# - Lint
# - Build
# - Docker build (validacao)
```

### Criar Release

```bash
# 1. Atualizar versao no codigo
# vim internal/version/version.go

# 2. Commit e push
git add .
git commit -m "chore: bump version to 1.2.0"
git push origin main

# 3. Criar tag
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin v1.2.0

# 4. Aguardar workflow completar (~10 min)
# - GitHub Release criado
# - Binarios anexados
# - Docker images pushed:
#    - seuusuario/onwapp-api:v1.2.0
#    - seuusuario/onwapp-api:v1.2
#    - seuusuario/onwapp-api:v1
#    - seuusuario/onwapp-api:latest
```

### Usar Imagens do Docker Hub

```bash
docker pull seuusuario/onwapp-api:latest
docker pull seuusuario/onwapp-api:v1.2.0
```

---

## Otimizacoes Implementadas

### 1. Cache Agressivo
```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```
- Usa cache do GitHub Actions
- Reduz tempo de build em 70%

### 2. Parallel Execution
- Jobs rodam em paralelo quando possivel
- Economiza tempo total

### 3. Multi-platform
```yaml
platforms: linux/amd64,linux/arm64
```
- Suporte nativo para ARM (Apple Silicon, Raspberry Pi)

### 4. Smart Tagging
- Multiplas tags automaticas (semver)
- Facilita versionamento

---

## Troubleshooting

### CI Falha no Docker Build

```bash
# Verificar Dockerfile.api localmente:
make docker-build
```

### Release Nao Faz Push

1. Verificar secrets no GitHub:
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`
2. Verificar token tem permissao de write

### Tag Nao Dispara Workflow

Tag deve comecar com `v`:
```bash
git tag v1.0.0  # Correto
git tag 1.0.0   # Errado
```

---

## Checklist de Validacao

Antes de fazer release:

- [ ] CI esta passando em `main`
- [ ] Versao atualizada em `internal/version/version.go`
- [ ] CHANGELOG.md atualizado
- [ ] Docker Hub secrets configurados
- [ ] Tag segue padrao `v*` (ex: v1.2.0)
- [ ] Build local funciona: `make docker-build`
- [ ] Testes passam: `make test`
- [ ] Lint passa: `make lint`

---

## Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [GoReleaser](https://goreleaser.com/)
- [Semantic Versioning](https://semver.org/)
