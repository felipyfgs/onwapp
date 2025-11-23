import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async create(createWebhookDto: CreateWebhookDto) {
    return this.prisma.webhook.create({
      data: {
        sessionId: createWebhookDto.sessionId,
        url: createWebhookDto.url,
        events: createWebhookDto.events,
        enabled: createWebhookDto.enabled ?? true,
      },
    });
  }

  async findBySessionId(sessionId: string) {
    return this.prisma.webhook.findMany({
      where: { sessionId },
    });
  }

  async findOne(id: string) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    return webhook;
  }

  async update(id: string, updateWebhookDto: UpdateWebhookDto) {
    await this.findOne(id);

    return this.prisma.webhook.update({
      where: { id },
      data: updateWebhookDto,
    });
  }

  async delete(id: string) {
    await this.findOne(id);

    return this.prisma.webhook.delete({
      where: { id },
    });
  }

  async trigger(sessionId: string, event: string, originalPayload: any) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        sessionId,
        enabled: true,
        events: {
          has: event,
        },
      },
    });

    if (webhooks.length === 0) {
      return;
    }

    const payload = {
      sessionId,
      event,
      timestamp: new Date().toISOString(),
      data: originalPayload,
    };

    const promises = webhooks.map(async (webhook) => {
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
    });

    await Promise.allSettled(promises);
  }
}
