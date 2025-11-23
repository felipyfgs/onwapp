import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetWebhookDto } from './dto/set-webhook.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { VALID_WEBHOOK_EVENTS } from './validators/is-valid-event.validator';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
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
      return;
    }

    const payload = {
      sessionId,
      event,
      timestamp: new Date().toISOString(),
      data: originalPayload,
    };

    try {
      await firstValueFrom(
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
    } catch (error) {
      this.logger.error(
        `Failed to send webhook to ${webhook.url} for event ${event}: ${error.message}`,
      );
    }
  }
}
