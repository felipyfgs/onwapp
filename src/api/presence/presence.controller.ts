import { Controller, Post, Param, Body } from '@nestjs/common';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PresenceService } from './presence.service';
import { SetPresenceDto, SuccessResponseDto } from './dto';

/**
 * Controller for presence status management.
 * Handles online/offline status and typing/recording indicators.
 */
@ApiTags('Presence')
@ApiSecurity('apikey')
@Controller('sessions/:session/presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Post()
  @ApiOperation({
    summary: 'Set presence status',
    description:
      'Set global presence (online/offline) or chat-specific (typing/recording/paused)',
  })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  async setPresence(
    @Param('session') session: string,
    @Body() dto: SetPresenceDto,
  ): Promise<SuccessResponseDto> {
    await this.presenceService.setPresence(session, dto);
    return { success: true };
  }

  @Post(':chatId/subscribe')
  @ApiOperation({
    summary: 'Subscribe to presence updates for a chat',
    description:
      'After subscribing, you will receive presence.update webhook events',
  })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiParam({ name: 'chatId', description: 'Chat ID (JID)' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  async subscribeToPresence(
    @Param('session') session: string,
    @Param('chatId') chatId: string,
  ): Promise<SuccessResponseDto> {
    await this.presenceService.subscribeToPresence(session, chatId);
    return { success: true };
  }
}
