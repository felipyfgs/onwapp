import { Injectable } from '@nestjs/common';
import { AuthState, Prisma } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../database.service';

@Injectable()
export class AuthStateRepository extends BaseRepository<AuthState> {
  constructor(prisma: DatabaseService) {
    super(prisma);
  }

  async upsert(
    sessionId: string,
    keyType: string,
    keyId: string,
    keyData: Prisma.JsonValue,
  ): Promise<AuthState> {
    return this.prisma.authState.upsert({
      where: {
        sessionId_keyType_keyId: {
          sessionId,
          keyType,
          keyId,
        },
      },
      create: {
        sessionId,
        keyType,
        keyId,
        keyData,
      },
      update: {
        keyData,
      },
    });
  }

  async findBySessionAndType(
    sessionId: string,
    keyType: string,
  ): Promise<AuthState[]> {
    return this.prisma.authState.findMany({
      where: {
        sessionId,
        keyType,
      },
    });
  }

  async findAllBySession(sessionId: string): Promise<AuthState[]> {
    return this.prisma.authState.findMany({
      where: { sessionId },
    });
  }

  async deleteBySession(sessionId: string): Promise<{ count: number }> {
    return this.prisma.authState.deleteMany({
      where: { sessionId },
    });
  }
}
