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
import { ChatwootConfigService, ChatwootImportService } from './services';
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
import { ZpwootEventData } from './interfaces';
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
    private readonly importService: ChatwootImportService,
  ) {}

  /**
   * Configure Chatwoot integration for a session
   */
  @Post('sessions/:sessionId/chatwoot/set')
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
    this.logger.log('Configurando integração Chatwoot', {
      event: 'chatwoot.config.set',
      sessionId,
    });
    const result = await this.configService.upsertConfig(sessionId, dto);
    return result as ChatwootConfigResponseDto;
  }

  /**
   * Get Chatwoot configuration for a session
   */
  @Get('sessions/:sessionId/chatwoot/find')
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
  @Delete('sessions/:sessionId/chatwoot')
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
    try {
      const result = await this.eventHandler.handleWebhookEvent({
        sessionId,
        event: payload.event,
        timestamp: payload.timestamp,
        data: payload.data as ZpwootEventData,
      });
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Erro ao processar evento zpwoot', {
        event: 'chatwoot.zpwoot.event.failure',
        sessionId,
        eventType: payload.event,
        error: errorMessage,
      });
      return { processed: false, error: errorMessage };
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
  receiveChatwootWebhook(
    @Param('sessionId') sessionId: string,
    @Body() body: ChatwootWebhookPayloadDto,
  ): ChatwootWebhookResponseDto {
    // Process webhook asynchronously to avoid Chatwoot timeout
    // Chatwoot has a short timeout (~5s) and sending media can take longer
    this.processWebhookAsync(sessionId, body);

    // Return immediately to acknowledge receipt
    return { status: 'received' };
  }

  /**
   * Process webhook asynchronously using setImmediate to avoid blocking
   * Chatwoot has a short timeout (~5s) and sending media can take longer
   * @private
   */
  private processWebhookAsync(
    sessionId: string,
    body: ChatwootWebhookPayloadDto,
  ): void {
    setImmediate(() => {
      this.webhookHandler
        .handleWebhook(sessionId, body)
        .then((result) => {
          if (result.status === 'error') {
            this.logger.warn('Webhook processado com erro', {
              event: 'chatwoot.webhook.process.warning',
              sessionId,
              error: result.error || result.reason,
            });
          }
        })
        .catch((error: unknown) => {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error('Erro ao processar webhook Chatwoot', {
            event: 'chatwoot.webhook.process.failure',
            sessionId,
            error: errorMessage,
          });
        });
    });
  }

  // ==================== Import/Sync Endpoints (PostgreSQL) ====================

  /**
   * Check if PostgreSQL import features are available
   */
  @Get('sessions/:sessionId/chatwoot/import/status')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('apikey')
  @ApiOperation({
    summary: 'Check import availability',
    description:
      'Check if PostgreSQL import features are available for this session',
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Import status',
  })
  async checkImportStatus(
    @Param('sessionId') sessionId: string,
  ): Promise<{ available: boolean; message: string }> {
    const available = await this.importService.isImportAvailable(sessionId);
    return {
      available,
      message: available
        ? 'PostgreSQL import features are available'
        : 'PostgreSQL URL not configured or connection failed',
    };
  }

  /**
   * Sync lost messages from the last N hours
   */
  @Post('sessions/:sessionId/chatwoot/sync')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('apikey')
  @ApiOperation({
    summary: 'Sync lost messages',
    description:
      'Sync messages that may have been lost between WhatsApp and Chatwoot. Default: 6 hours, max: 72 hours.',
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sync result',
  })
  async syncLostMessages(
    @Param('sessionId') sessionId: string,
    @Body() body?: { hours?: number },
  ): Promise<{
    success: boolean;
    imported: number;
    errors: string[];
    hours: number;
  }> {
    const hours = body?.hours || 6;
    this.logger.log('Syncing lost messages', {
      event: 'chatwoot.sync.start',
      sessionId,
      hours,
    });
    const result = await this.importService.syncLostMessages(sessionId, hours);
    return { ...result, hours: Math.min(Math.max(hours, 1), 72) };
  }

  /**
   * Import contacts to Chatwoot
   */
  @Post('sessions/:sessionId/chatwoot/import/contacts')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('apikey')
  @ApiOperation({
    summary: 'Import contacts',
    description:
      'Import WhatsApp contacts to Chatwoot via direct database access',
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Import result',
  })
  async importContacts(
    @Param('sessionId') sessionId: string,
  ): Promise<{ success: boolean; imported: number; errors: string[] }> {
    this.logger.log('Importing contacts to Chatwoot', {
      event: 'chatwoot.import.contacts.start',
      sessionId,
    });
    return this.importService.importHistoryContacts(sessionId);
  }

  /**
   * Import messages to Chatwoot
   */
  @Post('sessions/:sessionId/chatwoot/import/messages')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('apikey')
  @ApiOperation({
    summary: 'Import messages',
    description:
      'Import WhatsApp message history to Chatwoot via direct database access',
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Import result',
  })
  async importMessages(
    @Param('sessionId') sessionId: string,
  ): Promise<{ success: boolean; imported: number; errors: string[] }> {
    this.logger.log('Importing messages to Chatwoot', {
      event: 'chatwoot.import.messages.start',
      sessionId,
    });

    const inbox = await this.configService.getInbox(sessionId);
    if (!inbox) {
      return {
        success: false,
        imported: 0,
        errors: ['Inbox not found'],
      };
    }

    return this.importService.importHistoryMessages(sessionId, inbox);
  }
}
