import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookResponseDto,
  SuccessResponseDto,
  WEBHOOK_EVENTS,
} from './dto';

@ApiTags('Webhooks')
@ApiSecurity('apikey')
@Controller('sessions/:session/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get('events')
  @ApiOperation({ summary: 'List available webhook events' })
  @ApiResponse({ status: 200, description: 'List of available events' })
  getAvailableEvents(): { events: readonly string[] } {
    return { events: WEBHOOK_EVENTS };
  }

  @Post()
  @ApiOperation({ summary: 'Create or update webhook configuration' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 201,
    description: 'Webhook created',
    type: WebhookResponseDto,
  })
  async create(
    @Param('session') session: string,
    @Body() dto: CreateWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhookService.create(session, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get webhook configuration' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Webhook configuration',
    type: WebhookResponseDto,
  })
  async findOne(
    @Param('session') session: string,
  ): Promise<WebhookResponseDto | null> {
    return this.webhookService.findBySession(session);
  }

  @Put()
  @ApiOperation({ summary: 'Update webhook configuration' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Webhook updated',
    type: WebhookResponseDto,
  })
  async update(
    @Param('session') session: string,
    @Body() dto: UpdateWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhookService.update(session, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete webhook configuration' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Webhook deleted',
    type: SuccessResponseDto,
  })
  async remove(@Param('session') session: string): Promise<SuccessResponseDto> {
    await this.webhookService.delete(session);
    return { success: true };
  }
}
