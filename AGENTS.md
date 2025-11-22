# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Project-Specific Patterns

### AuthState Storage Architecture
- **Critical**: `sessionId` is NOT unique in the `AuthState` table. Multiple records per session are stored with different `keyId` values.
- Individual cryptographic keys (noiseKey, signedIdentityKey, signedPreKey, advSecretKey, pairingEphemeralKeyPair) are saved as separate AuthState records with `keyId` set to the key name.
- One unified AuthState record (with `keyId=null`) stores the main credentials object without the individual keys.
- The `getState()` method reconstructs the complete credentials by merging all individual key records back into the unified creds object.

### Buffer Serialization for WhatsApp Keys
- Custom `serializeBuffer()` and `bufferFromJSON()` methods in `src/whats/auth-state.ts` handle complex serialization of cryptographic keys.
- WhatsApp keys contain Buffers, Uint8Arrays, and Protobuf objects that must be serialized to JSON-compatible format before storing in Prisma's Json field.
- Protobuf objects have `toJSON()` methods that may fail - the code falls back to manual property iteration.

### Logger Compatibility Layer
- `createPinoLogger()` in `src/whats/whats.service.ts` wraps NestJS Logger to be compatible with whaileys' expected Pino logger interface.
- Maps Pino log levels (trace, debug, info, warn, error, fatal) to NestJS logger methods.

### API Key Authentication Flexibility
- `ApiKeyGuard` in `src/guards/api-key.guard.ts` supports three header formats simultaneously:
  - `apikey` header (primary)
  - `X-API-Key` header (backward compatibility)
  - `Authorization: Bearer <token>` (backward compatibility)

### WhatsApp Client Import Pattern
- Uses dynamic require pattern for ESM/CJS compatibility: `makeWASocketModule.default || makeWASocketModule`
- Destructure additional exports from the same module object.

### Webhook Multi-URL Support
- Sessions support multiple webhook URLs via `webhookConfigs` relation (one-to-many).
- Each webhook config can have different event subscriptions and enabled/disabled status.

### Prisma Json Type Casting
- Extensive use of `as any` when working with Prisma's Json type fields (`data` column in AuthState).
- TypeScript cannot infer Json field structures, requiring explicit casting when accessing nested properties.

### Session Status Mapping
- WhatsApp connection states ('open', 'connecting', 'close') are mapped to internal `SessionStatus` enum (connected, connecting, disconnected) in `session.service.ts`.

### Critical Key Extraction
- The `saveCreds` method specifically extracts 5 critical keys before saving: noiseKey, signedIdentityKey, signedPreKey, advSecretKey, pairingEphemeralKeyPair.
- These keys are saved individually to ensure they persist across reconnections and prevent QR code regeneration loops.

### Automatic Reconnection Logic
- On connection close with status code !== loggedOut, sessions automatically reconnect after 3 seconds.
- Corrupted credentials (TypeError with 'noiseKey' in message) trigger automatic cleanup of AuthState records.

## Commands
- `npm run start:dev` - Development with watch mode
- `npx prisma migrate deploy` - Apply pending migrations
- `docker-compose up -d postgres` - Start PostgreSQL only