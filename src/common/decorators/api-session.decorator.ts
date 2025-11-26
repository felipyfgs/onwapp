import { applyDecorators } from '@nestjs/common';
import {
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

/**
 * Composite decorator for session-related endpoints.
 * Applies common session parameter and error response documentation.
 *
 * @example
 * ```typescript
 * @Post('text')
 * @ApiSessionParam()
 * async sendText(@Param('sessionId') sessionId: string) {}
 * ```
 */
export function ApiSessionParam() {
  return applyDecorators(
    ApiParam({
      name: 'sessionId',
      description: 'ID da sessão WhatsApp',
      type: 'string',
      example: 'abc123-def456-ghi789',
    }),
    ApiBadRequestResponse({
      description: 'Sessão desconectada ou dados inválidos',
    }),
    ApiNotFoundResponse({
      description: 'Sessão não encontrada',
    }),
  );
}

/**
 * Composite decorator for JID parameter documentation.
 *
 * @example
 * ```typescript
 * @Get(':jid')
 * @ApiJidParam()
 * async getContact(@Param('jid') jid: string) {}
 * ```
 */
export function ApiJidParam(
  description = 'JID do contato ou grupo',
  name = 'jid',
) {
  return applyDecorators(
    ApiParam({
      name,
      description,
      type: 'string',
      example: '5511999999999@s.whatsapp.net',
    }),
  );
}

/**
 * Composite decorator for group ID parameter documentation.
 *
 * @example
 * ```typescript
 * @Get(':groupId')
 * @ApiGroupParam()
 * async getGroup(@Param('groupId') groupId: string) {}
 * ```
 */
export function ApiGroupParam() {
  return applyDecorators(
    ApiParam({
      name: 'groupId',
      description: 'ID do grupo WhatsApp',
      type: 'string',
      example: '123456789@g.us',
    }),
  );
}
