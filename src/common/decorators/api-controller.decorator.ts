import { applyDecorators, Controller, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiSecurity,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard';

/**
 * Options for the API controller decorator
 */
export interface ApiControllerOptions {
  /** Swagger tag for grouping endpoints */
  tag: string;
  /** Base path for the controller */
  path: string;
  /** Whether to require API key authentication (default: true) */
  requireAuth?: boolean;
}

/**
 * Composite decorator that applies common controller configurations:
 * - Controller path
 * - Swagger tags
 * - API key security
 * - Authentication guard
 * - Common error responses
 *
 * @example
 * ```typescript
 * @ApiController({ tag: 'Messages', path: 'sessions/:sessionId/messages' })
 * export class MessagesController {}
 * ```
 */
export function ApiController(options: ApiControllerOptions) {
  const { tag, path, requireAuth = true } = options;

  const decorators = [
    Controller(path),
    ApiTags(tag),
  ];

  if (requireAuth) {
    decorators.push(
      ApiSecurity('apikey'),
      ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' }),
      UseGuards(ApiKeyGuard),
    );
  }

  return applyDecorators(...decorators);
}

/**
 * Shorthand decorator for session-scoped controllers.
 * Automatically adds 'sessions/:sessionId' prefix to the path.
 *
 * @example
 * ```typescript
 * @SessionController({ tag: 'Messages', path: 'messages' })
 * export class MessagesController {}
 * // Results in path: 'sessions/:sessionId/messages'
 * ```
 */
export function SessionController(options: Omit<ApiControllerOptions, 'path'> & { path: string }) {
  return ApiController({
    ...options,
    path: `sessions/:sessionId/${options.path}`,
  });
}
