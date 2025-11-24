import { Injectable } from '@nestjs/common';
import { SessionSettings, Prisma } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../database.service';

@Injectable()
export class SessionSettingsRepository extends BaseRepository {
  constructor(prisma: DatabaseService) {
    super(prisma);
  }

  upsert(
    sessionId: string,
    data: Prisma.SessionSettingsCreateInput,
  ): Promise<SessionSettings> {
    return this.prisma.sessionSettings.upsert({
      where: { sessionId },
      create: data,
      update: data,
    });
  }

  findBySessionId(sessionId: string): Promise<SessionSettings | null> {
    return this.prisma.sessionSettings.findUnique({
      where: { sessionId },
    });
  }
}
