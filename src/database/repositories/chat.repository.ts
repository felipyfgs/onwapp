import { Injectable } from '@nestjs/common';
import { Chat, Prisma } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../database.service';

@Injectable()
export class ChatRepository extends BaseRepository {
  constructor(prisma: DatabaseService) {
    super(prisma);
  }

  async create(data: Prisma.ChatCreateInput): Promise<Chat> {
    return this.prisma.chat.create({ data });
  }

  async createMany(data: Prisma.ChatCreateManyInput[]): Promise<number> {
    const result = await this.prisma.chat.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }

  async findBySessionId(
    sessionId: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ): Promise<Chat[]> {
    return this.prisma.chat.findMany({
      where: { sessionId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { lastMessageTs: 'desc' },
    });
  }

  async findByRemoteJid(
    sessionId: string,
    remoteJid: string,
  ): Promise<Chat | null> {
    return this.prisma.chat.findUnique({
      where: {
        sessionId_remoteJid: {
          sessionId,
          remoteJid,
        },
      },
    });
  }

  async upsert(
    sessionId: string,
    remoteJid: string,
    create: Prisma.ChatCreateInput,
    update: Prisma.ChatUpdateInput,
  ): Promise<Chat> {
    return this.prisma.chat.upsert({
      where: {
        sessionId_remoteJid: {
          sessionId,
          remoteJid,
        },
      },
      create,
      update,
    });
  }

  async update(
    sessionId: string,
    remoteJid: string,
    data: Prisma.ChatUpdateInput,
  ): Promise<Chat> {
    return this.prisma.chat.update({
      where: {
        sessionId_remoteJid: {
          sessionId,
          remoteJid,
        },
      },
      data,
    });
  }

  async delete(sessionId: string, remoteJid: string): Promise<Chat> {
    return this.prisma.chat.delete({
      where: {
        sessionId_remoteJid: {
          sessionId,
          remoteJid,
        },
      },
    });
  }
}
