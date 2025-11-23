import { Injectable } from '@nestjs/common';
import { Webhook, Prisma } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../database.service';

@Injectable()
export class WebhookRepository extends BaseRepository<Webhook> {
  constructor(prisma: DatabaseService) {
    super(prisma);
  }

  async upsert(
    sessionId: string,
    create: Prisma.WebhookCreateInput,
    update: Prisma.WebhookUpdateInput,
  ): Promise<Webhook> {
    return this.prisma.webhook.upsert({
      where: { sessionId },
      create,
      update,
    });
  }

  async findBySessionId(sessionId: string): Promise<Webhook | null> {
    return this.prisma.webhook.findUnique({
      where: { sessionId },
    });
  }

  async delete(sessionId: string): Promise<Webhook> {
    return this.prisma.webhook.delete({
      where: { sessionId },
    });
  }
}
