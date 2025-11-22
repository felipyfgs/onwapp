# Copilot instructions for `zpwoot`

## 1. Vision & architecture
- This is a minimal **NestJS (v11)** app: the bootstrapper lives in `src/main.ts` and wires `AppModule` from `src/app.module.ts`.
- `AppModule` currently imports `LoggerModule`, `SessionModule` and `MessageModule` (see `src/app.module.ts`). Any new domains should follow the same module-per-bounded-context layout inside `src/modules/<domain>` or `src/<feature>`.
- `SessionService` and `MessageService` (in `src/modules/...`) are already exported so other modules can `import` and inject them—reuse that pattern rather than instantiating services manually.
- `LoggerModule` is a standalone provider group under `src/logger`; keep purely infrastructural helpers inside this folder. Any shared utilities should travel through dedicated modules that export the services you want to reuse.
- The newly generated `whats` module (`src/whats/whats.module.ts`) is not yet mounted in `AppModule`. When extending functionality, register new modules there so Nest can resolve providers.

## 2. Critical workflows
- Install dependencies once with `npm install` (uses `package-lock.json`).
- Run `npm run build` to emit `dist/` via `nest build`. The compiled code lives under `dist/` and is what `npm run start:prod` uses.
- For local development, use `npm run start:dev` (Nest’s hot-reload watcher). Use `npm run start:debug` when you need the Node inspector.
- Linting happens through `npm run lint`, which targets `{src,apps,libs,test}/**/*.ts` and fixes issues automatically when possible.

## 3. Testing & coverage
- Unit and integration tests use Jest with the config embedded in `package.json` (`rootDir: src`, `*.spec.ts`).
- Run `npm run test` for a single pass, `npm run test:watch` during development, `npm run test:debug` to attach the debugger, and `npm run test:cov` when you need coverage reports. `npm run test:e2e` points at `test/jest-e2e.json` for future end-to-end suites.
- Keep spec files next to the code they cover in `src/` to respect the `rootDir` assumption.

## 4. Code conventions & patterns
- Every domain follows the Nest module convention: `<domain>.module.ts` imports a service and exports it when others need it. Copy this skeleton when adding new domains.
- Services are decorated with `@Injectable()` inside their own folders, even if temporarily empty, to keep Nest’s dependency graph predictable (`src/modules/*/*.service.ts`, `src/whats/*.service.ts`).
- Prefer injecting dependencies via constructors (Nest-style DI) instead of manual instantiation—keep modules responsible for wiring providers via `providers` + `exports` arrays.
- Keep environment-specific configuration strictly through `process.env` (see `src/main.ts` for the `PORT` lookup). Add new env hooks near bootstrap if needed.

## 5. Integration & future-proofing clues
- There are no controllers yet; new HTTP/API entry points should live inside the relevant module (e.g., `src/modules/message/message.controller.ts`), then register them via the module’s `controllers` array.
- If you need cross-cutting features (e.g., logging, metrics), augment `LoggerModule` so other modules can `import LoggerModule` and consume `LoggerService` via Nest DI.
- Keep an eye on `src/modules/session/session.module.ts`: it’s designed to share session data through its exported service. Any module requiring session context should import `SessionModule` rather than replicating session logic.

## 6. Maintenance notes
- The repo currently lacks automated tests and controllers. When adding features, mirror the existing folder structure to keep things discoverable.
- `npm run format` uses Prettier to format `src/**/*.ts` and `test/**/*.ts`; run it after significant edits if lint autofix doesn’t catch everything.

## 7. Feedback loop
If any instruction above is unclear or incomplete, tell me what pieces are missing so I can refine these guidance notes.