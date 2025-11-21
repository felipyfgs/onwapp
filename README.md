# zpwoot - WhatsApp Multi-Session API

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11.0-E0234E?style=for-the-badge&logo=nestjs" alt="NestJS">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-7.0-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
</p>

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Documentação da API](#documentação-da-api)
- [Webhooks](#webhooks)
- [Exemplos](#exemplos)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Licença](#licença)

## 🎯 Sobre o Projeto

**zpwoot** é uma API REST robusta construída com NestJS que fornece uma camada de abstração completa sobre o WhatsApp Web. Utilizando a biblioteca **whaileys** (fork do Baileys), o projeto implementa um sistema de gerenciamento de sessões multi-instância com persistência em banco de dados PostgreSQL.

### Principais Diferenciais

- ✅ **Multi-sessão**: Gerencie múltiplas instâncias do WhatsApp simultaneamente
- ✅ **Persistência em Banco**: Credenciais armazenadas em PostgreSQL via Prisma
- ✅ **Webhooks**: Sistema completo de notificações em tempo real
- ✅ **API RESTful**: Endpoints bem documentados com Swagger
- ✅ **Reconexão Automática**: Mantém sessões ativas automaticamente
- ✅ **Docker Ready**: Pronto para deploy com Docker Compose
- ✅ **TypeScript**: Tipagem forte e código type-safe

## 🚀 Funcionalidades

### Gerenciamento de Sessões

- [x] Criar, listar, deletar sessões
- [x] Conectar/desconectar do WhatsApp
- [x] Autenticação via QR Code
- [x] Logout completo com limpeza de credenciais
- [x] Status de conexão em tempo real
- [x] Reconexão automática

### Webhooks

- [x] Configuração por sessão
- [x] Múltiplas URLs de webhook por sessão
- [x] 14 tipos de eventos suportados
- [x] Tentativas automáticas de entrega
- [x] Timeout configurável (10 segundos)

### Eventos de Webhook Disponíveis

| Evento | Descrição |
|--------|-----------|
| `connection.update` | Mudanças no status de conexão |
| `messages.upsert` | Novas mensagens recebidas/enviadas |
| `messages.update` | Atualizações em mensagens |
| `messages.delete` | Mensagens deletadas |
| `message-receipt.update` | Confirmações de leitura/entrega |
| `groups.upsert` | Novos grupos |
| `groups.update` | Atualizações em grupos |
| `group-participants.update` | Mudanças em participantes |
| `contacts.upsert` | Novos contatos |
| `contacts.update` | Atualizações em contatos |
| `presence.update` | Status de presença (online/offline) |
| `chats.upsert` | Novos chats |
| `chats.update` | Atualizações em chats |
| `chats.delete` | Chats deletados |

## 🛠️ Tecnologias

### Backend

- **[NestJS](https://nestjs.com/)** - Framework Node.js progressivo
- **[TypeScript](https://www.typescriptlang.org/)** - JavaScript com tipagem
- **[Prisma](https://www.prisma.io/)** - ORM moderno para Node.js
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional
- **[whaileys](https://github.com/WhiskeySockets/Baileys)** - Cliente WhatsApp Web

### Ferramentas

- **Docker & Docker Compose** - Containerização
- **Swagger/OpenAPI** - Documentação automática da API
- **class-validator** - Validação de DTOs
- **ESLint & Prettier** - Linting e formatação

## 📦 Pré-requisitos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **PostgreSQL** >= 15.x (ou Docker)
- **Docker** (opcional, mas recomendado)

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/zpwoot.git
cd zpwoot
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# Database
DATABASE_URL="postgresql://zpwoot:zpwoot123@localhost:5432/zpwoot"

# API Security
GLOBAL_API_KEY="your-secret-api-key-here"

# Server
PORT=3000
```

### 4. Inicie o banco de dados

```bash
docker-compose up -d postgres
```

### 5. Execute as migrations

```bash
npx prisma migrate deploy
```

### 6. Inicie o servidor

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão | Obrigatório |
|----------|-----------|--------|-------------|
| `DATABASE_URL` | URL de conexão do PostgreSQL | - | ✅ |
| `GLOBAL_API_KEY` | Chave de API para autenticação | - | ✅ |
| `PORT` | Porta do servidor | 3000 | ❌ |

### Docker Compose

O projeto inclui um `docker-compose.yml` configurado:

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

## 📖 Uso

### Acesse a documentação Swagger

Após iniciar o servidor, acesse:

```
http://localhost:3000/api
```

### Autenticação

Todas as requisições requerem o header `X-API-Key`:

```bash
curl -H "X-API-Key: your-secret-api-key-here" \
  http://localhost:3000/sessions/list
```

Ou via `Authorization` Bearer:

```bash
curl -H "Authorization: Bearer your-secret-api-key-here" \
  http://localhost:3000/sessions/list
```

## 🌐 Documentação da API

### Endpoints Principais

#### Sessões

```http
POST   /sessions/create              # Criar nova sessão
GET    /sessions/list                # Listar todas as sessões
GET    /sessions/:id/info            # Detalhes da sessão
DELETE /sessions/:id/delete          # Deletar sessão
POST   /sessions/:id/connect         # Conectar ao WhatsApp
POST   /sessions/:id/disconnect      # Desconectar (mantém credenciais)
POST   /sessions/:id/logout          # Logout completo (remove credenciais)
GET    /sessions/:id/qr              # Obter QR Code
GET    /sessions/:id/status          # Status da conexão
POST   /sessions/:id/pair            # Parear com telefone (em desenvolvimento)
GET    /sessions/webhook/events      # Listar eventos disponíveis
```

### Documentação Completa

📄 Veja a documentação detalhada em: [`plans/session-routes-documentation.md`](plans/session-routes-documentation.md)

Inclui:
- Todos os endpoints com exemplos
- DTOs e validações
- Códigos de status HTTP
- Tratamento de erros
- Fluxos de uso
- Exemplos práticos

## 🔔 Webhooks

### Configurar Webhook ao Criar Sessão

```bash
curl -X POST http://localhost:3000/sessions/create \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-session",
    "webhookUrl": "https://your-domain.com/webhook",
    "webhookEvents": ["messages.upsert", "connection.update"]
  }'
```

### Payload do Webhook

```json
{
  "event": "messages.upsert",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "sessionName": "my-session",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "messages": [
      {
        "key": {
          "remoteJid": "5511999999999@s.whatsapp.net",
          "fromMe": false,
          "id": "ABC123"
        },
        "message": {
          "conversation": "Hello!"
        },
        "messageTimestamp": "1705318200"
      }
    ]
  }
}
```

### Servidor de Webhook (Exemplo Node.js)

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const { event, sessionId, data } = req.body;
  
  console.log(`Received event: ${event} from session: ${sessionId}`);
  console.log('Data:', JSON.stringify(data, null, 2));
  
  // Processar evento...
  
  res.status(200).json({ received: true });
});

app.listen(8080, () => {
  console.log('Webhook server running on port 8080');
});
```

## 💡 Exemplos

### Fluxo Completo: Criar e Conectar Sessão

```javascript
const API_URL = 'http://localhost:3000';
const API_KEY = 'your-api-key';

async function createAndConnectSession() {
  // 1. Criar sessão
  const session = await fetch(`${API_URL}/sessions/create`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'my-whatsapp-session',
      webhookUrl: 'https://example.com/webhook',
      webhookEvents: ['messages.upsert', 'connection.update']
    })
  }).then(r => r.json());

  console.log('Session created:', session.id);

  // 2. Conectar
  await fetch(`${API_URL}/sessions/${session.id}/connect`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY }
  });

  // 3. Aguardar QR Code
  let qrCode = null;
  while (!qrCode) {
    const qrResponse = await fetch(
      `${API_URL}/sessions/${session.id}/qr`,
      { headers: { 'X-API-Key': API_KEY } }
    ).then(r => r.json());

    if (qrResponse.qrCode) {
      qrCode = qrResponse.qrCode;
      console.log('QR Code:', qrCode);
      // Exibir QR Code para o usuário escanear
    } else {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // 4. Aguardar conexão
  while (true) {
    const status = await fetch(
      `${API_URL}/sessions/${session.id}/status`,
      { headers: { 'X-API-Key': API_KEY } }
    ).then(r => r.json());

    console.log('Status:', status.status);

    if (status.status === 'connected') {
      console.log('Connected!', status.phoneNumber);
      break;
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  return session;
}

createAndConnectSession();
```

### Cliente JavaScript Completo

Veja o exemplo completo em: [`plans/session-routes-documentation.md#exemplo-completo-cliente-javascript`](plans/session-routes-documentation.md#-exemplos-práticos)

## 📁 Estrutura do Projeto

```
zpwoot/
├── prisma/
│   ├── schema.prisma              # Schema do banco de dados
│   └── migrations/                # Migrations do Prisma
├── src/
│   ├── guards/
│   │   └── api-key.guard.ts       # Guard de autenticação
│   ├── modules/
│   │   ├── session/               # Módulo de sessões
│   │   │   ├── dto/               # Data Transfer Objects
│   │   │   ├── session.controller.ts
│   │   │   ├── session.service.ts
│   │   │   └── session.module.ts
│   │   ├── message/               # Módulo de mensagens (em desenvolvimento)
│   │   └── webhook/               # Módulo de webhooks
│   │       ├── webhook.service.ts
│   │       └── webhook.module.ts
│   ├── prisma/
│   │   ├── prisma.service.ts      # Serviço do Prisma
│   │   └── prisma.module.ts
│   ├── whats/
│   │   ├── whats.service.ts       # Serviço do WhatsApp
│   │   ├── whats.module.ts
│   │   └── database-auth-state.ts # Gerenciamento de autenticação
│   ├── app.module.ts              # Módulo principal
│   └── main.ts                    # Entry point
├── plans/
│   └── session-routes-documentation.md  # Documentação completa
├── .env.example                   # Exemplo de variáveis de ambiente
├── docker-compose.yml             # Configuração Docker
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Segurança

### Boas Práticas

1. **API Key Forte**: Use uma chave de API complexa e única
2. **HTTPS**: Em produção, sempre use HTTPS
3. **Webhook Security**: Valide webhooks com assinaturas
4. **Rate Limiting**: Implemente rate limiting (planejado)
5. **Firewall**: Restrinja acesso ao banco de dados

### Exemplo de API Key Segura

```bash
