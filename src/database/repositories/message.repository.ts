import { Injectable } from '@nestjs/common';
import { Message, Prisma } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../database.service';

@Injectable()
export class MessageRepository extends BaseRepository<Message> {
  constructor(prisma: DatabaseService) {
    super(prisma);
  }

  async create(data: Prisma.MessageCreateInput): Promise<Message> {
    return this.prisma.message.create({ data });
  }

  async createMany(data: Prisma.MessageCreateManyInput[]): Promise<number> {
    const result = await this.prisma.message.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }

  async findBySessionId(sessionId: string, options?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.MessageOrderByWithRelationInput;
  }): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { sessionId },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { timestamp: 'desc' },
    });
  }

  async findByChatId(chatId: string, options?: {
    skip?: number;
    take?: number;
  }): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { chatId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { timestamp: 'desc' },
    });
  }

  async update(
    id: string,
    data: Prisma.MessageUpdateInput,
  ): Promise<Message> {
    return this.prisma.message.update({
      where: { id },
      data,
    });
  }

  async markAsDeleted(id: string): Promise<Message> {
    return this.prisma.message.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async delete(id: string): Promise<Message> {
    return this.prisma.message.delete({ where: { id } });
  }
}
