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
} from '@nestjs/common';
import { ChatwootService } from './chatwoot.service';
import { ChatwootDto } from './dto/chatwoot.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class ChatwootController {
  private readonly logger = new Logger(ChatwootController.name);

  constructor(private readonly chatwootService: ChatwootService) {}

  @Post('session/:sessionId/chatwoot/set')
  @UseGuards(ApiKeyGuard)
  async setChatwoot(
    @Param('sessionId') sessionId: string,
    @Body() dto: ChatwootDto,
  ) {
    this.logger.log(`Setting Chatwoot config for session: ${sessionId}`);
    return this.chatwootService.create(sessionId, dto);
  }

  @Get('session/:sessionId/chatwoot/find')
  @UseGuards(ApiKeyGuard)
  async findChatwoot(@Param('sessionId') sessionId: string) {
    const config = await this.chatwootService.find(sessionId);
    if (!config) {
      return {
        enabled: false,
        message: 'Chatwoot not configured for this session',
      };
    }
    return config;
  }

  @Delete('session/:sessionId/chatwoot')
  @UseGuards(ApiKeyGuard)
  async deleteChatwoot(@Param('sessionId') sessionId: string) {
    await this.chatwootService.delete(sessionId);
    return { success: true, message: 'Chatwoot configuration deleted' };
  }

  @Post('chatwoot/webhook/:sessionId')
  @Public()
  @HttpCode(200)
  async receiveWebhook(
    @Param('sessionId') sessionId: string,
    @Body() body: any,
  ) {
    this.logger.debug(`Received Chatwoot webhook for session: ${sessionId}`);
    this.logger.debug(`Webhook body: ${JSON.stringify(body)}`);

    // TODO: Implement webhook handling
    // This will be called when agents send messages from Chatwoot
    // We need to forward these messages to WhatsApp

    if (!body?.conversation || body.private) {
      return { status: 'ignored', reason: 'No conversation or private message' };
    }

    if (body.message_type !== 'outgoing') {
      return { status: 'ignored', reason: 'Not an outgoing message' };
    }

    // Get chat ID from conversation
    const chatId = body.conversation?.meta?.sender?.identifier ||
                   body.conversation?.meta?.sender?.phone_number?.replace('+', '');

    if (!chatId) {
      return { status: 'error', reason: 'Could not determine chat ID' };
    }

    this.logger.log(`Chatwoot webhook: Send message to ${chatId}`);

    // TODO: Forward message to WhatsApp
    // This requires injecting WhatsAppService

    return {
      status: 'received',
      sessionId,
      chatId,
      content: body.content,
      hasAttachments: body.attachments?.length > 0,
    };
  }
}
