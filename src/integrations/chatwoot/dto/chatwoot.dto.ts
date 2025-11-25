// Re-export all DTOs for backward compatibility
export * from './set-chatwoot-config.dto';
export * from './chatwoot-response.dto';
export * from './chatwoot-webhook.dto';

// Backward compatibility alias
import { SetChatwootConfigDto } from './set-chatwoot-config.dto';

/**
 * @deprecated Use SetChatwootConfigDto instead
 */
export class ChatwootDto extends SetChatwootConfigDto {}
