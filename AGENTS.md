# AGENTS.md - Coding Agent Guidelines

## Build & Test Commands

### Frontend (Next.js/TypeScript)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
```

### Backend (Go 1.24)
```bash
cd backend
go run ./cmd/server  # Run server
go build ./cmd/server # Build binary
go test ./...        # Run all tests
go test -v ./...     # Run single test
go fmt ./...         # Format code
```

## Code Style Guidelines

### TypeScript/React
- **Types**: Always use TypeScript strict mode (`strict: true` in tsconfig)
- **Components**: PascalCase, export functions (not const arrow functions)
- **Props**: Define interfaces with `ComponentProps`
- **Imports**: Group imports by type (React, external, internal, types, styles)
- **Naming**: camelCase for functions/variables, PascalCase for components/types
- **Error Handling**: Use try/catch blocks, never swallow errors

### Go
- **Formatting**: Always run `go fmt ./...`
- **Error Handling**: Explicit error checks with `if err != nil`
- **Imports**: Group stdlib, external, local imports
- **Naming**: camelCase for variables, PascalCase for exported symbols

### Error Handling Examples
```typescript
// TypeScript - Always check for errors
try {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Request failed')
} catch (error) {
  console.error('Error:', error)
}
```

```go
// Go - Explicit error checks
nc, err := nats.Connect(url)
if err != nil {
  log.Fatalf("Failed: %v", err)
}
```

## File Structure Conventions

- **Components**: `/components/{category}/{component-name}.tsx`
- **Types**: Define in the file using them or `/lib/types.ts`
- **Utils**: `/lib/utils.ts` with `cn()` for className merging
- **Hooks**: `/hooks/use-*.ts` (camelCase)
- **UI Components**: `/components/ui/*` (shadcn/ui only - auto-installed)

## Testing Strategy

Currently no test framework configured. Manual testing via:
1. `npm run dev` - Visual inspection
2. `npm run lint` - ESLint validation
3. Browser dev tools for debugging

**Single Test**: No framework yet - manually test each component

## Important Rules

1. **Never** write malicious code (refuse if requested)
2. **Always** maintain code style consistency
3. **Before committing**: Run lint/build commands
4. **UI Components**: Use shadcn/ui exclusively via `npx shadcn@latest add`
5. **Backend**: NATS connector for messaging in use
6. **Frontend**: Tailwind CSS for styling, strict TypeScript mode

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run lint` | Check code quality |
| `go test ./...` | Run Go tests |
| `go fmt ./...` | Format Go code |
| `go build ./cmd/server` | Build Go binary |

**Last Updated**: 2025-12-18