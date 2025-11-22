# AGENTS.md

## Orientações para agentes de IA neste repositório

Este projeto é um backend NestJS (TypeScript) com integração ao WhatsApp e persistência via Prisma ORM. Siga estas diretrizes para máxima produtividade:

### Visão Geral
- Estrutura modular: cada domínio (ex: `sessions`, `whatsapp`) possui controller, service e DTOs em `src/<domínio>/`.
- Persistência de dados via Prisma (`prisma/`).
- Utilitários compartilhados em `src/common/` (decorators, guards, logger).

### Fluxos de trabalho essenciais
- Instalar dependências: `npm install`
- Rodar servidor de desenvolvimento: `npm run start:dev`
- Build de produção: `npm run start:prod`
- Testes: `npm run test`, `npm run test:e2e`, `npm run test:cov`
- Migrações Prisma: editar `prisma/schema.prisma` e rodar `npx prisma migrate dev`

### Padrões e convenções
- Injeção de dependências via construtor dos services.
- DTOs para validação/tipagem de requests/responses.
- Queries ao banco sempre via `PrismaService` (`src/prisma/prisma.service.ts`).
- Autenticação por API key via `api-key.guard.ts`.
- Endpoints públicos usam o decorator `@Public()`.
- Logger centralizado em `src/common/logger/`.

### Integrações e comunicação
- Integração WhatsApp em `src/whatsapp/`.
- Módulo de sessões em `src/sessions/`.
- Esquema do banco em `prisma/schema.prisma`.

### Exemplos de uso
- Injeção de serviço:
  ```typescript
  constructor(private readonly sessionsService: SessionsService) {}
  ```
- DTO em controller:
  ```typescript
  @Body() createSessionDto: CreateSessionDto
  ```
- Guard:
  ```typescript
  @UseGuards(ApiKeyGuard)
  ```
- Endpoint público:
  ```typescript
  @Public()
  @Post('login')
  ```

### Recursos externos
- Documentação NestJS: https://docs.nestjs.com
- Documentação Prisma: https://www.prisma.io/docs

---

Se alguma seção estiver incompleta ou pouco clara, envie feedback para aprimorarmos estas instruções.