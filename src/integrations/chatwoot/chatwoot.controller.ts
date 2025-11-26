import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatwootConfigService } from './services';
import { ChatwootEventHandler } from './chatwoot-event.handler';
import { ChatwootWebhookHandler } from './handlers';
import {
  SetChatwootConfigDto,
  ChatwootConfigResponseDto,
  ChatwootNotConfiguredResponseDto,
  ChatwootDeleteResponseDto,
  ChatwootWebhookResponseDto,
  ZpwootEventResponseDto,
  ChatwootWebhookPayloadDto,
  ZpwootEventPayloadDto,
} from './dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Controller for Chatwoot integration
 *
 * Handles configuration management and webhook endpoints for
 * bidirectional communication between WhatsApp and Chatwoot.
 */
@ApiTags('Chatwoot')
@Controller()
export class ChatwootController {
  private readonly logger = new Logger(ChatwootController.name);

  constructor(
    private readonly configService: ChatwootConfigService,
    private readonly eventHandler: ChatwootEventHandler,
    private readonly webhookHandler: ChatwootWebhookHandler,
  ) {}

  /**
   * Configure Chatwoot integration for a session
   */
  @Post('session/:sessionId/chatwoot/set')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('apikey')
  @ApiOperation({
    summary: 'Configure Chatwoot integration',
    description:
      'Set or update Chatwoot integration configuration for a session',
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuration saved successfully',
    type: ChatwootConfigResponseDto,
  })
  async setChatwoot(
    @Param('sessionId') sessionId: string,
    @Body() dto: SetChatwootConfigDto,
  ): Promise<ChatwootConfigResponseDto> {
    this.logger.log(`Setting Chatwoot config for session: ${sessionId}`);
    const result = await this.configService.upsertConfig(sessionId, dto);
    return result as ChatwootConfigResponseDto;
  }

  /**
   * Get Chatwoot configuration for a session
   */
  @Get('session/:sessionId/chatwoot/find')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('apikey')
  @ApiOperation({
    summary: 'Get Chatwoot configuration',
    description: 'Retrieve Chatwoot integration configuration for a session',
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuration found',
    type: ChatwootConfigResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuration not found',
    type: ChatwootNotConfiguredResponseDto,
  })
  async findChatwoot(
    @Param('sessionId') sessionId: string,
  ): Promise<ChatwootConfigResponseDto | ChatwootNotConfiguredResponseDto> {
    const config = await this.configService.findConfig(sessionId);
    if (!config) {
      return {
        enabled: false,
        message: 'Chatwoot not configured for this session',
      };
    }
    return config as ChatwootConfigResponseDto;
  }

  /**
   * Delete Chatwoot configuration for a session
   */
  @Delete('session/:sessionId/chatwoot')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('apikey')
  @ApiOperation({
    summary: 'Delete Chatwoot configuration',
    description: 'Remove Chatwoot integration configuration for a session',
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuration deleted successfully',
    type: ChatwootDeleteResponseDto,
  })
  async deleteChatwoot(
    @Param('sessionId') sessionId: string,
  ): Promise<ChatwootDeleteResponseDto> {
    await this.configService.deleteConfig(sessionId);
    return { success: true, message: 'Chatwoot configuration deleted' };
  }

  /**
   * Receive zpwoot webhook events and forward to Chatwoot
   *
   * Internal endpoint for forwarding WhatsApp events to Chatwoot.
   * Configure your zpwoot webhook URL to point to this endpoint.
   */
  @Post('chatwoot/receive/:sessionId')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive zpwoot events',
    description:
      'Internal endpoint to receive zpwoot webhook events for Chatwoot forwarding',
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event processed',
    type: ZpwootEventResponseDto,
  })
  async receiveZpwootEvent(
    @Param('sessionId') sessionId: string,
    @Body() payload: ZpwootEventPayloadDto,
  ): Promise<ZpwootEventResponseDto> {
    this.logger.debug(
      `[${sessionId}] Received zpwoot event for Chatwoot: ${payload.event}`,
    );

    try {
      const result = await this.eventHandler.handleWebhookEvent({
        sessionId,
        event: payload.event,
        timestamp: payload.timestamp,

        data: payload.data as any,
      });
      return result;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Error processing zpwoot event: ${(error as Error).message}`,
      );
      return { processed: false, error: (error as Error).message };
    }
  }

  /**
   * Receive webhook events from Chatwoot
   *
   * This endpoint receives events from Chatwoot when agents send messages.
   * Configure this URL in your Chatwoot inbox webhook settings.
   *
   * Note: Processing is done asynchronously to avoid Chatwoot webhook timeout.
   * The response is sent immediately to acknowledge receipt.
   */
  @Post('chatwoot/webhook/:sessionId')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive Chatwoot webhooks',
    description:
      'Webhook endpoint that Chatwoot calls when agents send messages',
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook received',
    type: ChatwootWebhookResponseDto,
  })
  async receiveChatwootWebhook(
    @Param('sessionId') sessionId: string,
    @Body() body: ChatwootWebhookPayloadDto,
  ): Promise<ChatwootWebhookResponseDto> {
    this.logger.debug(
      `[${sessionId}] Received Chatwoot webhook: ${body.event}`,
    );

    // Process webhook asynchronously to avoid Chatwoot timeout
    // Chatwoot has a short timeout (~5s) and sending media can take longer
    setImmediate(async () => {
      try {
        const result = await this.webhookHandler.handleWebhook(sessionId, body);
        this.logger.debug(
          `[${sessionId}] Webhook processed: ${JSON.stringify(result)}`,
        );
      } catch (error) {
        this.logger.error(
          `[${sessionId}] Error processing Chatwoot webhook: ${(error as Error).message}`,
        );
      }
    });

    // Return immediately to acknowledge receipt
    return { status: 'received' };
  }
}
