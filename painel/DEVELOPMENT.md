# 🚀 OnWapp Painel - Guia de Desenvolvimento

## 🔄 Suporte Híbrido: Local Dev + Docker Production

O painel agora suporta **AMBAS** as formas de configuração:

### 1️⃣ **Desenvolvimento Local** (com `npm run dev`)

```bash
# 1. Copie o arquivo de exemplo
cd painel
cp .env.local.example .env.local

# 2. Edite .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080

# 3. Inicie o painel
npm run dev

# 4. Acesse
http://localhost:3000
```

**Como funciona:**
- ✅ Browser faz chamadas diretas para `http://localhost:8080`
- ✅ Sem proxy (mais rápido para debugar)
- ✅ CORS configurado na API para aceitar localhost

**Exemplo de requisição:**
```javascript
// Browser chama diretamente:
fetch('http://localhost:8080/sessions', {
  headers: { 'Authorization': 'sua-api-key' }
})
```

---

### 2️⃣ **Produção Docker** (com Docker/Swarm)

```bash
# Stack Docker NÃO precisa de NEXT_PUBLIC_API_URL!
# O código detecta automaticamente e usa o proxy

docker stack deploy -c docker-compose-v1.yaml onwapp
```

**Como funciona:**
- ✅ Browser faz chamadas para `/api/proxy/sessions`
- ✅ Proxy Next.js usa `API_URL=http://onwapp_api:8080` (rede interna)
- ✅ Mesma imagem funciona em qualquer domínio
- ✅ Sem hardcoded URLs

**Exemplo de requisição:**
```javascript
// Browser chama o proxy:
fetch('/api/proxy/sessions')
// Proxy chama internamente: http://onwapp_api:8080/sessions
```

---

## 🧠 Lógica Inteligente (config.ts)

```typescript
export function getApiUrl(): string {
  // Server-side: usa API_URL (rede docker interna)
  if (typeof window === 'undefined') {
    return process.env.API_URL || 'http://localhost:8080'
  }
  
  // Client-side: verifica se tem NEXT_PUBLIC_API_URL
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL
  if (publicApiUrl && publicApiUrl !== 'undefined') {
    return publicApiUrl // LOCAL DEV ✅
  }
  
  // Fallback para proxy (PRODUCTION DOCKER) ✅
  return '/api/proxy'
}
```

---

## 📊 Comparação

| Aspecto | Local Dev | Docker Production |
|---------|-----------|-------------------|
| **Variável usada** | `NEXT_PUBLIC_API_URL` | `API_URL` |
| **Onde é definida** | `.env.local` | `docker-compose.yaml` |
| **URL do browser** | `http://localhost:8080` | `/api/proxy` |
| **Proxy?** | ❌ Não | ✅ Sim |
| **CORS** | API aceita localhost | Não precisa (same-origin) |
| **Debug** | ✅ Fácil (direto) | Mais difícil (via proxy) |
| **Portabilidade** | ❌ Hardcoded | ✅ Funciona em qualquer domínio |

---

## 🛠️ Comandos Úteis

### Desenvolvimento Local:

```bash
# Instalar dependências
npm install

# Rodar em dev mode
npm run dev

# Rodar em dev mode com outra porta
PORT=3001 npm run dev

# Build para testar localmente
npm run build
npm start
```

### Docker Local (Teste):

```bash
# Build da imagem
docker build -t onwapp-painel:dev .

# Rodar com NEXT_PUBLIC_API_URL (dev mode)
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8080 \
  onwapp-painel:dev

# Rodar sem NEXT_PUBLIC_API_URL (production mode - usa proxy)
docker run -p 3000:3000 \
  -e API_URL=http://host.docker.internal:8080 \
  onwapp-painel:dev
```

---

## 🐛 Troubleshooting

### Problema: "Failed to fetch" em dev local

**Causa:** API backend não está rodando ou CORS não configurado

**Solução:**
```bash
# Verifique se a API está rodando
curl http://localhost:8080/health

# Verifique CORS na API (internal/api/router/router.go)
AllowedOrigins: []string{"*"} // ou adicione http://localhost:3000
```

### Problema: "404" ou "502" em produção Docker

**Causa:** Proxy não consegue alcançar a API

**Solução:**
```bash
# Verifique se API está na mesma rede Docker
docker network inspect infraNet

# Verifique DNS interno
docker exec <painel-container> ping onwapp_api

# Verifique variável API_URL
docker exec <painel-container> env | grep API_URL
```

### Problema: Ainda usando URLs antigas

**Causa:** Código buildado com valores antigos

**Solução:**
```bash
# Delete node_modules e .next
rm -rf node_modules .next

# Reinstale e rebuilde
npm install
npm run build
```

---

## 📦 Estrutura de Arquivos

```
painel/
├── .env.local.example    # Template para dev local
├── .env.local            # Suas configs locais (gitignored)
├── app/
│   └── api/
│       └── proxy/        # Proxy route para production
│           └── [...path]/
│               └── route.ts
├── lib/
│   └── api/
│       └── config.ts     # Lógica híbrida aqui!
└── next.config.ts        # output: 'standalone'
```

---

## ✅ Verificação Rápida

Execute para testar se está tudo OK:

```bash
# 1. Teste a lógica de detecção
cd painel
npm run dev

# 2. Abra console do browser (F12)
# 3. Digite:
fetch('/api/proxy/health')  // Deve funcionar em Docker
# ou
fetch('http://localhost:8080/health')  // Deve funcionar em dev local
```

---

## 🎯 Resumo

- ✅ **Local dev**: Usa `NEXT_PUBLIC_API_URL` → chamadas diretas
- ✅ **Docker prod**: Usa `/api/proxy` → sem hardcoded domains
- ✅ **Código inteligente**: Detecta automaticamente o ambiente
- ✅ **Zero configuração**: Build do Docker não precisa de NEXT_PUBLIC_*

**Agora você tem o melhor dos dois mundos!** 🎉
