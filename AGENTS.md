# AGENTS.md - Documentação de Arquitetura e Agentes

## 📋 Visão Geral do Projeto

**zpwoot** é uma aplicação backend construída com **NestJS v11** para gerenciamento de sessões WhatsApp, utilizando a biblioteca **whaileys** (Baileys) para integração com a API não oficial do WhatsApp Web. O projeto implementa uma arquitetura modular com foco em logging estruturado, gestão de mensagens e conexões WhatsApp.

### Objetivo Principal
Gerenciar múltiplas sessões WhatsApp, processar mensagens recebidas, e fornecer uma API para interação com o WhatsApp.

---

## 🏗️ Arquitetura do Sistema

### Estrutura Modular

```
src/
├── app.module.ts           # Módulo raiz da aplicação
├── main.ts                 # Ponto de entrada do servidor
├── logger/                 # Sistema de logging
│   ├── logger.module.ts
│   └── logger.service.ts
├── modules/
│   ├── session/            # Gerenciamento de sessões
│   │   ├── session.module.ts
│   │   └── session.service.ts
│   └── message/            # Processamento de mensagens
│       ├── message.module.ts
│       └── message.service.ts
├── prisma/                 # Integração com banco de dados
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── whats/                  # Integração WhatsApp (Whaileys/Baileys)
    ├── whats.module.ts
    └── whats.service.ts
```

---

## 🤖 Agentes e Serviços

### 1. **LoggerService** - Agente de Logging Estruturado

**Localização:** `src/logger/logger.service.ts`

**Responsabilidades:**
- Logging estruturado usando **Pino** para alta performance
- Formatação bonita em desenvolvimento com `pino-pretty`
- Implementa a interface `NestLoggerService` para integração com o NestJS
- Níveis de log: `log`, `info`, `error`, `warn`, `debug`, `verbose`

**Características Principais:**
```typescript
- Configuração via variável de ambiente LOG_LEVEL (padrão: 'info')
- Pretty printing em ambiente não-production
- Formato estruturado JSON em produção
- Timestamp formatado: 'yyyy-mm-dd HH:MM:ss'
- Suporte a metadados e stack traces em erros
```

**Uso em Outros Agentes:**
- Injetado no `WhatsService` para logs de conexão
- Usado globalmente no bootstrap da aplicação

**Configuração:**
```bash
LOG_LEVEL=debug  # Níveis: trace, debug, info, warn, error, fatal
NODE_ENV=production  # Desabilita pretty printing
```

---

### 2. **WhatsService** - Agente de Conexão WhatsApp

**Localização:** `src/whats/whats.service.ts`

**Responsabilidades:**
- Gerenciar conexão com WhatsApp Web via biblioteca `whaileys`
- Autenticação multi-arquivo (sessões persistentes)
- Geração e exibição de QR Code para pareamento
- Reconexão automática em caso de desconexão (exceto logout)
- Recepção e delegação de mensagens ao `MessageService`
- Envio de mensagens

**Características Principais:**

#### Lifecycle Hooks
```typescript
onModuleInit()    → Conecta automaticamente ao WhatsApp na inicialização
onModuleDestroy() → Encerra conexão gracefully ao desligar
```

#### Gerenciamento de Conexão
- **Estado de autenticação:** Armazenado em `./whats-session` (configurável via `WHATS_SESSION_DIR`)
- **QR Code:** Gerado no terminal quando necessário
- **Reconexão:** Automática exceto quando deslogado (`DisconnectReason.loggedOut`)

#### Event Handlers
```typescript
connection.update  → Monitora estado da conexão (qr, close, open)
messages.upsert    → Recebe mensagens novas
creds.update       → Salva credenciais atualizadas
```

#### API Pública
```typescript
async sendMessage(jid: string, content: AnyMessageContent)
  → Envia mensagem para um número/grupo
  → Retorna Promise com resultado do envio
```

**Dependências:**
- `LoggerService`: Logs de eventos de conexão
- `MessageService`: Processamento de mensagens recebidas
- `whaileys`: Biblioteca de integração WhatsApp
- `qrcode-terminal`: Exibição de QR codes

**Configuração:**
```bash
WHATS_SESSION_DIR=./whats-session  # Diretório de armazenamento de sessão
```

---

### 3. **MessageService** - Agente de Processamento de Mensagens

**Localização:** `src/modules/message/message.service.ts`

**Responsabilidades:**
- Processar mensagens recebidas do WhatsApp
- Implementar lógica de negócio para respostas automáticas (TODO)
- Análise e classificação de mensagens

**Status Atual:**
⚠️ **STUB** - Apenas estrutura básica implementada

**Interface:**
```typescript
async handleMessage(message: WAMessage): Promise<void>
  → Recebe mensagem do WhatsApp
  → Processa e executa ações (a implementar)
```

**Próximas Implementações Sugeridas:**
- Extrair texto, mídia, localização de mensagens
- Implementar comandos automáticos
- Integração com banco de dados para histórico
- Análise de contexto de conversação
- Respostas automáticas e chatbots

---

### 4. **SessionService** - Agente de Gerenciamento de Sessões

**Localização:** `src/modules/session/session.service.ts`

**Responsabilidades:**
- Gerenciar múltiplas sessões WhatsApp (planejado)
- CRUD de sessões
- Associação de credenciais com banco de dados

**Status Atual:**
⚠️ **STUB** - Classe vazia, pronta para implementação

**Implementações Planejadas:**
```typescript
// Métodos sugeridos para implementação futura
createSession(name: string, credentials?: any): Promise<Session>
listSessions(): Promise<Session[]>
getSession(id: string): Promise<Session>
deleteSession(id: string): Promise<void>
connectSession(id: string): Promise<void>
disconnectSession(id: string): Promise<void>
getQRCode(id: string): Promise<string>
checkStatus(id: string): Promise<SessionStatus>
```

**Integração Planejada:**
- **Prisma:** Persistência de sessões
- **WhatsService:** Controle de múltiplas instâncias

---

### 5. **PrismaService** - Agente de Persistência de Dados

**Localização:** `src/prisma/prisma.service.ts`

**Responsabilidades:**
- Interface com PostgreSQL via Prisma ORM
- Gerenciamento de conexões do banco de dados
- Operações CRUD em modelos

**Status Atual:**
⚠️ **STUB** - Classe vazia

**Schema Atual:** (`prisma/schema.prisma`)
```prisma
generator client {
  provider = "prisma-client"
}

datasource db {
  provider = "postgresql"
}
```

**Modelos Sugeridos:**
```prisma
// Exemplo de schema futuro
model Session {
  id          String   @id @default(uuid())
  name        String   @unique
  credentials Json
  status      String   // connected, disconnected, qr_pending
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  messages    Message[]
}

model Message {
  id        String   @id @default(uuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id])
  from      String
  to        String
  body      String
  timestamp DateTime
  type      String   // text, image, video, audio, document
  metadata  Json?
}
```

---

## 🔧 Dependências Técnicas

### Produção
| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `@nestjs/common` | ^11.0.1 | Framework NestJS core |
| `@nestjs/core` | ^11.0.1 | Framework NestJS core |
| `@nestjs/platform-express` | ^11.0.1 | Integração Express |
| `pino` | ^10.1.0 | Logger estruturado de alta performance |
| `pino-pretty` | ^13.1.2 | Formatação bonita de logs |
| `qrcode-terminal` | ^0.12.0 | Exibição de QR codes no terminal |
| `whaileys` | ^6.4.2 | Integração WhatsApp Web (Baileys fork) |
| `rxjs` | ^7.8.1 | Programação reativa |
| `reflect-metadata` | ^0.2.2 | Decorators e metadados |

### Desenvolvimento
| Pacote | Propósito |
|--------|-----------|
| `prisma` ^7.0.0 | ORM e migrações |
| `typescript` ^5.7.3 | Linguagem |
| `jest` ^30.0.0 | Testes |
| `eslint` ^9.18.0 | Linting |
| `prettier` ^3.4.2 | Formatação de código |

---

## 🚀 Comandos e Execução

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm run start:dev    # Modo watch com hot-reload
npm run start:debug  # Modo debug
npm run start        # Modo normal
```

### Produção
```bash
npm run build        # Compilar TypeScript
npm run start:prod   # Executar build de produção
```

### Qualidade de Código
```bash
npm run lint         # ESLint com auto-fix
npm run format       # Prettier em todos os .ts
```

### Testes
```bash
npm run test         # Testes unitários
npm run test:watch   # Testes em modo watch
npm run test:cov     # Cobertura de testes
npm run test:e2e     # Testes end-to-end
```

---

## 📝 Configuração de Ambiente

### Variáveis de Ambiente Recomendadas

Criar arquivo `.env` na raiz:

```bash
# Servidor
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info

# WhatsApp
WHATS_SESSION_DIR=./whats-session

# Banco de Dados (quando Prisma for implementado)
# DATABASE_URL=postgresql://usuario:senha@localhost:5432/zpwoot
```

---

## 🎯 Estado Atual vs. Implementações Futuras

### ✅ Implementado
- [x] Estrutura modular do NestJS
- [x] Sistema de logging robusto com Pino
- [x] Conexão WhatsApp com autenticação persistente
- [x] Geração de QR Code para pareamento
- [x] Reconexão automática
- [x] Recepção de mensagens
- [x] Envio de mensagens
- [x] Lifecycle management (inicialização e shutdown)

### 🚧 Em Desenvolvimento (Stubs Criados)
- [ ] **SessionService:** Gerenciamento de múltiplas sessões
- [ ] **PrismaService:** Integração completa com banco de dados
- [ ] **MessageService:** Lógica de processamento de mensagens

### 📋 Planejado
- [ ] Controllers REST para API HTTP
- [ ] DTOs e validação de entrada
- [ ] Autenticação via API Key global
- [ ] Webhook para eventos externos
- [ ] Endpoints de gerenciamento de sessão:
  - POST `/sessions` - Criar sessão
  - GET `/sessions` - Listar sessões
  - GET `/sessions/:id` - Detalhes da sessão
  - DELETE `/sessions/:id` - Deletar sessão
  - POST `/sessions/:id/connect` - Conectar
  - POST `/sessions/:id/disconnect` - Desconectar
  - GET `/sessions/:id/qr` - Obter QR Code
  - POST `/sessions/:id/pair` - Parear com telefone
  - GET `/sessions/:id/status` - Status da conexão
  - POST `/sessions/:id/logout` - Fazer logout
- [ ] Armazenamento de mensagens em banco de dados
- [ ] Sistema de filas para mensagens
- [ ] Rate limiting e throttling
- [ ] Tratamento avançado de erros
- [ ] Documentação OpenAPI/Swagger
- [ ] Testes unitários e E2E completos
- [ ] Docker Compose para desenvolvimento

---

## 🔐 Segurança e Boas Práticas

### Recomendações de Implementação

1. **Autenticação:**
   - Implementar guard global para API Key
   - Variáveis de ambiente para secrets
   - Nunca commitar credenciais

2. **Sessões WhatsApp:**
   - Diretório `whats-session/` no `.gitignore`
   - Backup regular de credenciais
   - Criptografia de dados sensíveis no banco

3. **Logging:**
   - Não logar dados sensíveis (números, mensagens completas)
   - Usar níveis apropriados (error para falhas críticas)
   - Rotação de logs em produção

4. **Performance:**
   - Usar filas (Bull/BullMQ) para processamento assíncrono
   - Implementar rate limiting no WhatsApp
   - Cache de sessões ativas

---

## 🧪 Testes

### Estrutura Atual
Configurado com Jest, mas sem testes implementados ainda.

### Sugestões de Testes

**Unitários:**
```typescript
// logger.service.spec.ts
describe('LoggerService', () => {
  it('deve logar mensagens info com payload');
  it('deve incluir trace em mensagens de erro');
});

// whats.service.spec.ts
describe('WhatsService', () => {
  it('deve conectar ao WhatsApp na inicialização');
  it('deve reconectar após desconexão temporária');
  it('não deve reconectar após logout');
  it('deve enviar mensagens com sucesso');
});
```

**E2E:**
```typescript
// session.e2e-spec.ts
describe('Session Management (e2e)', () => {
  it('POST /sessions deve criar nova sessão');
  it('GET /sessions/:id/qr deve retornar QR code');
});
```

---

## 👥 Para Desenvolvedores / Agentes IA

### Convenções do Projeto
- **Idioma:** Português para comentários e logs
- **Estilo:** Prettier + ESLint configurados
- **Commits:** Descritivos e em português
- **Tipos:** TypeScript strict mode

### Ao Adicionar Novas Features

1. **Criar módulo completo:**
   ```bash
   nest g module nome
   nest g service nome
   nest g controller nome
   ```

2. **Implementar DTOs:**
   - Usar `class-validator` e `class-transformer`
   - Validação automática com `ValidationPipe`

3. **Documentar:**
   - JSDoc em métodos públicos
   - Atualizar este AGENTS.md
   - Adicionar exemplos de uso

4. **Testar:**
   - Escrever testes unitários
   - Validar integração com outros serviços

### Fluxo de Trabalho Recomendado

1. **Implementar PrismaService primeiro:**
   - Definir schema completo
   - Gerar migrações
   - Extends `PrismaClient` e implementar hooks

2. **Completar SessionService:**
   - Integrar com Prisma para CRUD
   - Gerenciar múltiplas instâncias de `WhatsService`
   - Implementar isolamento de sessões

3. **Adicionar Controllers:**
   - REST API para gerenciamento de sessões
   - Guards de autenticação
   - Validação de entrada com DTOs

4. **Implementar MessageService:**
   - Processamento inteligente de mensagens
   - Comandos e respostas automáticas
   - Integração com banco de dados

---

## 📚 Recursos Externos

- **NestJS:** https://docs.nestjs.com
- **Whaileys (Baileys):** https://github.com/whiskeysockets/Baileys
- **Prisma:** https://www.prisma.io/docs
- **Pino:** https://getpino.io

---

## 📞 Suporte e Contexto

Este projeto foi criado para fornecer uma API robusta de gerenciamento de WhatsApp com suporte a múltiplas sessões. O código atual representa a fundação do sistema, com os principais agentes (Logger e WhatsApp) completamente implementados e funcionais.

**Última Atualização:** 2025-11-22
