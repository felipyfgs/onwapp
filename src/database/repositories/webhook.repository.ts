import { Injectable } from '@nestjs/common';
import { Webhook, Prisma } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../database.service';

@Injectable()
export class WebhookRepository extends BaseRepository {
  constructor(prisma: DatabaseService) {
    super(prisma);
  }

  upsert(sessionId: string, data: Prisma.WebhookCreateInput): Promise<Webhook> {
    return this.prisma.webhook.upsert({
      where: { sessionId },
      create: data,
      update: data,
    });
  }

  findBySessionId(sessionId: string): Promise<Webhook | null> {
    return this.prisma.webhook.findUnique({
      where: { sessionId },
    });
  }

  delete(sessionId: string): Promise<Webhook> {
    return this.prisma.webhook.delete({
      where: { sessionId },
    });
  }
}
