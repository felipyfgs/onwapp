## Visão Geral

Este documento descreve as convenções, padrões arquitetônicos e melhores práticas do projeto zpwoot - uma API REST robusta construída com NestJS que fornece uma camada de abstração completa sobre o WhatsApp Web, utilizando a biblioteca whaileys.

## Stack Tecnológica

- **NestJS 11.0** - Framework Node.js progressivo para construção de APIs eficientes e escaláveis
- **TypeScript 5.7** - JavaScript com tipagem estática para maior robustez do código
- **Prisma 7.0** - ORM moderno para acesso ao banco de dados com type-safety
- **PostgreSQL** - Banco de dados relacional para persistência de sessões e configurações
- **whaileys 6.4.2** - Cliente WhatsApp Web para gerenciamento de conexões
- **Swagger/OpenAPI** - Documentação automática da API
- **class-validator & class-transformer** - Validação e transformação de DTOs
- **ESLint & Prettier** - Linting e formatação de código

## Arquitetura e Estrutura de Diretórios

O projeto segue uma arquitetura modular baseada em recursos, com organização clara de responsabilidades:

```
src/
├── guards/              # Guards de autenticação e autorização
├── modules/            # Módulos de recursos (feature modules)
│   ├── message/         # Módulo de mensagens
│   ├── session/         # Módulo de sessões WhatsApp
│   └── webhook/         # Módulo de webhooks
├── prisma/              # Configuração e serviço do Prisma
├── whats/               # Integração com WhatsApp (whaileys)
├── app.module.ts        # Módulo raiz da aplicação
└── main.ts             # Ponto de entrada da aplicação
```

### Padrão Arquitetural

- **Modularidade**: Cada funcionalidade é organizada em módulos independentes
- **Separação de Responsabilidades**: Controllers para HTTP, Services para lógica de negócio
- **Injeção de Dependências**: Padrão DI do NestJS para gerenciamento de dependências
- **Abstração de Banco de Dados**: Prisma como ORM com migrations versionadas

## Padrões e Convenções de Código

### Nomenclatura

- **Arquivos**: kebab-case para arquivos comuns (ex: `api-key.guard.ts`), PascalCase para classes (ex: `SessionService.ts`)
- **Classes**: PascalCase (ex: `SessionService`, `CreateSessionDto`)
- **Métodos e Variáveis**: camelCase (ex: `createSession`, `sessionId`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `WEBHOOK_EVENTS`)
- **Interfaces e Types**: PascalCase com sufixos descritivos (ex: `WebhookPayload`, `ConnectionState`)

### Estrutura de Componentes

#### Controllers
- Decoradores `@ApiTags()` para agrupamento no Swagger
- `@ApiSecurity()` para endpoints protegidos
- `@UseGuards()` para proteção de rotas
- `@ApiOperation()` e `@ApiResponse()` para documentação
- Validação com `@Body(ValidationPipe)`

#### Services
- Injeção de dependências no construtor
- Logger privado: `private readonly logger = new Logger(ServiceName.name)`
- Métodos assíncronos para operações de I/O
- Tratamento de exceções com exceções do NestJS

#### DTOs (Data Transfer Objects)
- Validação com decorators do `class-validator`
- Documentação com decorators do `@nestjs/swagger`
- Exportação via arquivo `index.ts` no diretório dto

### Gerenciamento de Estado

#### Estado Local
- Utilização de Maps para gerenciamento de estado em memória:
  ```typescript
  private sessions: Map<string, WASocket> = new Map();
  private qrCodes: Map<string, string> = new Map();
  ```

#### Estado Persistido
- Estado de autenticação armazenado no PostgreSQL via Prisma
- Implementação customizada `DatabaseAuthState` para compatibilidade com whaileys
- Serialização de Buffers para armazenamento JSON-compatible

### Estilização

O projeto é uma API backend, portanto não utiliza estilização CSS. A formatação do código segue as regras do Prettier:
- Aspas simples: `"singleQuote": true`
- Vírgulas finais: `"trailingComma": "all"`

### Testes

- Configuração Jest para testes unitários e de integração
- Arquivos de teste com sufixo `.spec.ts`
- Diretório `test/` para testes e2e com configuração própria
- Scripts disponíveis: `test`, `test:watch`, `test:cov`, `test:e2e`

## Fluxo de Trabalho de Desenvolvimento

### Scripts Principais

- `npm run start:dev` - Modo desenvolvimento com hot-reload
- `npm run build` - Build para produção
- `npm run start:prod` - Execução em produção
- `npm run lint` - Linting e correção automática
- `npm run format` - Formatação com Prettier
- `npm run test` - Execução de testes
- `npx prisma migrate dev` - Criar e aplicar novas migrations
- `npx prisma generate` - Gerar cliente Prisma

### Fluxo de Desenvolvimento

1. Criar migrations para alterações no schema: `npx prisma migrate dev --name <migration-name>`
2. Gerar cliente Prisma: `npx prisma generate`
3. Implementar mudanças no código
4. Executar linting: `npm run lint`
5. Executar testes: `npm run test`
6. Build de verificação: `npm run build`

## Regras de Linting e Formatação

### ESLint

- Configuração baseada em `@typescript-eslint/recommended-type-checked`
- Regras personalizadas:
  - `@typescript-eslint/no-explicit-any: 'off'` - Uso de any permitido
  - `@typescript-eslint/no-floating-promises: 'warn'` - Alerta para promises não tratadas
  - `@typescript-eslint/no-unsafe-argument: 'warn'` - Alerta para argumentos inseguros
  - `prettier/prettier: ["error", { endOfLine: "auto" }]` - Integração com Prettier

### Prettier

- Aspas simples
- Vírgulas finais
- Sempre que possível, 0 espaços de indentação para JSX

## Padrões Específicos do Projeto

### Autenticação

- API Key via header `apikey` (método principal)
- Suporte para `X-API-Key` e `Authorization: Bearer` (compatibilidade)
- Implementação via `ApiKeyGuard`

### Webhooks

- Sistema de notificações assíncronas
- Timeout de 10 segundos para requisições
- Payload padronizado com campos: `event`, `sessionId`, `sessionName`, `timestamp`, `data`
- Suporte a múltiplas URLs de webhook por sessão

### Gerenciamento de Sessões WhatsApp

- Multi-sessão com isolamento completo
- Persistência de estado de autenticação em banco
- Reconexão automática em caso de desconexão não intencional
- Geração e gerenciamento de QR Codes

### Logging

- Uso do Logger do NestJS em todos os serviços
- Níveis de log apropriados (debug, log, warn, error)
- Logs estruturados para facilitar debugging

### Tratamento de Erros

- Uso de exceções do NestJS: `BadRequestException`, `NotFoundException`, `UnauthorizedException`
- Mensagens de erro descritivas
- Logging de erros com contexto adequado

### Configuração

- Variáveis de ambiente via `.env`
- ConfigModule global do NestJS
- Validação de variáveis essenciais (API_KEY, DATABASE_URL)

## Boas Práticas

1. **Sempre usar TypeScript** - Evitar ao máximo o uso de `any`
2. **Documentar endpoints** - Utilizar decorators do Swagger para documentação completa
3. **Validar entrada de dados** - Usar DTOs com validação do class-validator
4. **Tratamento de erros** - Implementar tratamento adequado de exceções
5. **Logging** - Adicionar logs informativos para operações importantes
6. **Testes** - Escrever testes para lógica de negócio crítica
7. **Migrations** - Sempre criar migrations para alterações no schema
8. **Segurança** - Nunca expor dados sensíveis em respostas ou logs