# Copilot Instructions for AI Agents

## Project Overview
- This is a NestJS (TypeScript) backend service, organized by domain modules under `src/`.
- Key modules: `sessions` (session management), `whatsapp` (WhatsApp integration), `prisma` (database access), and `common` (shared decorators, guards, logger).
- Data persistence is managed via Prisma ORM, with schema and migrations in `prisma/`.

## Architecture & Patterns
- Each domain (e.g., `sessions`, `whatsapp`) has its own controller, service, and DTOs in `src/<domain>/`.
- Dependency injection is used for services and modules (see `app.module.ts`).
- Custom decorators and guards are in `src/common/` (e.g., `public.decorator.ts`, `api-key.guard.ts`).
- Logging uses a custom service in `src/common/logger/`.
- Database access is abstracted via `PrismaService` in `src/prisma/prisma.service.ts`.

## Developer Workflows
- **Install dependencies:** `npm install`
- **Run development server:** `npm run start:dev`
- **Production build:** `npm run start:prod`
- **Run tests:** `npm run test` (unit), `npm run test:e2e` (end-to-end), `npm run test:cov` (coverage)
- **Prisma migrations:**
  - Edit `prisma/schema.prisma` and run `npx prisma migrate dev` to apply changes.
- **Debugging:** Use NestJS built-in debugging tools and custom logger outputs.

## Conventions & Integration
- DTOs are used for request/response validation and typing (see `src/sessions/dto/`).
- All database queries go through Prisma service/module.
- API key authentication is enforced via `api-key.guard.ts`.
- Public endpoints use the `@Public()` decorator.
- External WhatsApp integration logic is in `src/whatsapp/`.
- Logging is centralized via `LoggerService` and `pino.logger.ts`.

## Key Files & Directories
- `src/app.module.ts`: Main module, imports all domain modules.
- `src/main.ts`: Application entrypoint.
- `src/prisma/`: Database access and configuration.
- `src/sessions/`: Session management logic and API.
- `src/whatsapp/`: WhatsApp integration logic.
- `src/common/`: Shared utilities (decorators, guards, logger).
- `prisma/schema.prisma`: Database schema.
- `prisma/migrations/`: Migration history.

## Example Patterns
- **Service injection:**
  ```typescript
  constructor(private readonly sessionsService: SessionsService) {}
  ```
- **DTO usage:**
  ```typescript
  @Body() createSessionDto: CreateSessionDto
  ```
- **Guard application:**
  ```typescript
  @UseGuards(ApiKeyGuard)
  ```
- **Public endpoint:**
  ```typescript
  @Public()
  @Post('login')
  ```

## External Resources
- Refer to NestJS docs for framework details: https://docs.nestjs.com
- Prisma docs for database: https://www.prisma.io/docs

---

_If any section is unclear or missing key project-specific details, please provide feedback to improve these instructions._
