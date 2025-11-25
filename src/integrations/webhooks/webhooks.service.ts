import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { SetWebhookDto } from './dto/set-webhook.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { VALID_WEBHOOK_EVENTS } from './validators/is-valid-event.validator';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: DatabaseService,
    private readonly httpService: HttpService,
  ) {}

  async set(sessionId: string, setWebhookDto: SetWebhookDto) {
    return this.prisma.webhook.upsert({
      where: { sessionId },
      create: {
        sessionId,
        url: setWebhookDto.url,
        events: setWebhookDto.events,
        enabled: setWebhookDto.enabled ?? true,
      },
      update: {
        url: setWebhookDto.url,
        events: setWebhookDto.events,
        enabled: setWebhookDto.enabled ?? true,
      },
    });
  }

  async findBySessionId(sessionId: string) {
    return this.prisma.webhook.findUnique({
      where: { sessionId },
    });
  }

  getAvailableEvents(): string[] {
    return VALID_WEBHOOK_EVENTS;
  }

  async trigger(sessionId: string, event: string, originalPayload: any) {
    const webhook = await this.prisma.webhook.findUnique({
      where: {
        sessionId,
      },
    });

    if (!webhook || !webhook.enabled || !webhook.events.includes(event)) {
      return {
        sent: false,
        reason: 'Webhook not configured or event not enabled',
      };
    }

    const payload = {
      sessionId,
      event,
      timestamp: new Date().toISOString(),
      data: originalPayload,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(webhook.url, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }),
      );
      this.logger.log(
        `Webhook sent successfully to ${webhook.url} for event ${event}`,
      );
      return { sent: true, status: response.status, url: webhook.url };
    } catch (error) {
      this.logger.error(
        `Failed to send webhook to ${webhook.url} for event ${event}: ${error.message}`,
      );
      return { sent: false, error: error.message, url: webhook.url };
    }
  }

  async test(sessionId: string, event?: string) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { sessionId },
    });

    if (!webhook) {
      return {
        success: false,
        error: 'Webhook not configured for this session',
      };
    }

    if (!webhook.enabled) {
      return { success: false, error: 'Webhook is disabled' };
    }

    const testEvent = event || webhook.events[0] || 'connection.update';
    const testPayload = {
      test: true,
      message: 'This is a test webhook from Zpwoot',
      timestamp: new Date().toISOString(),
    };

    const result = await this.trigger(sessionId, testEvent, testPayload);
    return {
      success: result.sent,
      event: testEvent,
      webhookUrl: webhook.url,
      ...result,
    };
  }
}
