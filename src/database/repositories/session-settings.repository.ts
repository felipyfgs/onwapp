import { Injectable } from '@nestjs/common';
import { SessionSettings, Prisma } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../database.service';

@Injectable()
export class SessionSettingsRepository extends BaseRepository<SessionSettings> {
  constructor(prisma: DatabaseService) {
    super(prisma);
  }

  async upsert(
    sessionId: string,
    create: Prisma.SessionSettingsCreateInput,
    update: Prisma.SessionSettingsUpdateInput,
  ): Promise<SessionSettings> {
    return this.prisma.sessionSettings.upsert({
      where: { sessionId },
      create,
      update,
    });
  }

  async findBySessionId(sessionId: string): Promise<SessionSettings | null> {
    return this.prisma.sessionSettings.findUnique({
      where: { sessionId },
    });
  }
}
