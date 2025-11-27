import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWebhookDto, UpdateWebhookDto, WebhookResponseDto } from './dto';

export interface WebhookPayload {
  sessionName: string;
  event: string;
  data: unknown;
  timestamp: Date;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    sessionName: string,
    dto: CreateWebhookDto,
  ): Promise<WebhookResponseDto> {
    const session = await this.prisma.session.findUnique({
      where: { name: sessionName },
    });

    if (!session) {
      throw new NotFoundException(`Session '${sessionName}' not found`);
    }

    const webhook = await this.prisma.webhook.upsert({
      where: { sessionId: session.id },
      update: {
        url: dto.url,
        events: dto.events,
        enabled: dto.enabled ?? true,
      },
      create: {
        sessionId: session.id,
        url: dto.url,
        events: dto.events,
        enabled: dto.enabled ?? true,
      },
    });

    this.logger.log(`Webhook created for session ${sessionName}: ${dto.url}`);
    return webhook;
  }

  async findBySession(sessionName: string): Promise<WebhookResponseDto | null> {
    const session = await this.prisma.session.findUnique({
      where: { name: sessionName },
      include: { webhook: true },
    });

    if (!session) {
      throw new NotFoundException(`Session '${sessionName}' not found`);
    }

    return session.webhook;
  }

  async update(
    sessionName: string,
    dto: UpdateWebhookDto,
  ): Promise<WebhookResponseDto> {
    const session = await this.prisma.session.findUnique({
      where: { name: sessionName },
      include: { webhook: true },
    });

    if (!session) {
      throw new NotFoundException(`Session '${sessionName}' not found`);
    }

    if (!session.webhook) {
      throw new NotFoundException(
        `Webhook not configured for session '${sessionName}'`,
      );
    }

    const webhook = await this.prisma.webhook.update({
      where: { id: session.webhook.id },
      data: {
        url: dto.url,
        events: dto.events,
        enabled: dto.enabled,
      },
    });

    this.logger.log(`Webhook updated for session ${sessionName}`);
    return webhook;
  }

  async delete(sessionName: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { name: sessionName },
      include: { webhook: true },
    });

    if (!session) {
      throw new NotFoundException(`Session '${sessionName}' not found`);
    }

    if (!session.webhook) {
      throw new NotFoundException(
        `Webhook not configured for session '${sessionName}'`,
      );
    }

    await this.prisma.webhook.delete({
      where: { id: session.webhook.id },
    });

    this.logger.log(`Webhook deleted for session ${sessionName}`);
  }

  async getWebhookBySessionId(sessionId: string) {
    return this.prisma.webhook.findUnique({
      where: { sessionId },
    });
  }

  async dispatch(
    sessionId: string,
    event: string,
    data: unknown,
  ): Promise<void> {
    const webhook = await this.getWebhookBySessionId(sessionId);

    if (!webhook || !webhook.enabled) {
      return;
    }

    if (!webhook.events.includes(event) && !webhook.events.includes('*')) {
      return;
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    const payload: WebhookPayload = {
      sessionName: session?.name || sessionId,
      event,
      data,
      timestamp: new Date(),
    };

    this.sendWebhook(webhook.url, payload);
  }

  private sendWebhook(url: string, payload: WebhookPayload): void {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          this.logger.warn(`Webhook failed for ${url}: ${response.status}`);
        } else {
          this.logger.debug(`Webhook sent to ${url}: ${payload.event}`);
        }
      })
      .catch((error) => {
        this.logger.error(`Webhook error for ${url}: ${error.message}`);
      });
  }
}
