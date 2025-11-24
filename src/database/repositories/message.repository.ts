import { Injectable } from '@nestjs/common';
import { Message, Prisma } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../database.service';

@Injectable()
export class MessageRepository extends BaseRepository {
  constructor(prisma: DatabaseService) {
    super(prisma);
  }

  create(data: Prisma.MessageCreateInput): Promise<Message> {
    return this.prisma.message.create({ data });
  }

  async createMany(data: Prisma.MessageCreateManyInput[]): Promise<number> {
    const result = await this.prisma.message.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }

  findBySessionId(
    sessionId: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { sessionId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { timestamp: 'desc' },
    });
  }

  findByChatId(
    sessionId: string,
    chatId: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        sessionId,
        chatId,
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { timestamp: 'desc' },
    });
  }

  update(
    sessionId: string,
    messageId: string,
    data: Prisma.MessageUpdateInput,
  ): Promise<Message> {
    return this.prisma.message.update({
      where: {
        sessionId_messageId: {
          sessionId,
          messageId,
        },
      },
      data,
    });
  }

  markAsDeleted(sessionId: string, messageId: string): Promise<Message> {
    return this.prisma.message.update({
      where: {
        sessionId_messageId: {
          sessionId,
          messageId,
        },
      },
      data: { isDeleted: true },
    });
  }

  delete(sessionId: string, messageId: string): Promise<Message> {
    return this.prisma.message.delete({
      where: {
        sessionId_messageId: {
          sessionId,
          messageId,
        },
      },
    });
  }
}
