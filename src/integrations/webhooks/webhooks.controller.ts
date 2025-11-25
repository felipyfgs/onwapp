import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { SetWebhookDto } from './dto/set-webhook.dto';
import { TestWebhookDto } from './dto/test-webhook.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@Controller()
@UseGuards(ApiKeyGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('session/:sessionId/webhook/set')
  set(
    @Param('sessionId') sessionId: string,
    @Body() setWebhookDto: SetWebhookDto,
  ) {
    return this.webhooksService.set(sessionId, setWebhookDto);
  }

  @Get('session/:sessionId/webhook/find')
  find(@Param('sessionId') sessionId: string) {
    return this.webhooksService.findBySessionId(sessionId);
  }

  @Get('webhook/events')
  getEvents() {
    return this.webhooksService.getAvailableEvents();
  }

  @Post('session/:sessionId/webhook/test')
  async test(
    @Param('sessionId') sessionId: string,
    @Body() testWebhookDto: TestWebhookDto,
  ) {
    return this.webhooksService.test(sessionId, testWebhookDto.event);
  }
}
