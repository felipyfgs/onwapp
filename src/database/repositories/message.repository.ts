import { Injectable } from '@nestjs/common';
import { Message, Prisma, MessageStatus } from '@prisma/client';
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

  // Otimização: buscar por texto usando índice
  async findByTextContent(
    sessionId: string,
    textSearch: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        sessionId,
        textContent: {
          contains: textSearch,
          mode: 'insensitive',
        },
        isDeleted: false,
      },
      skip: options?.offset || 0,
      take: options?.limit || 50,
      orderBy: { timestamp: 'desc' },
    });
  }

  // Otimização: buscar por mídia usando índice
  async findByMediaUrl(
    sessionId: string,
    mediaUrl?: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<Message[]> {
    const where: any = {
      sessionId,
      mediaUrl: { not: null },
      isDeleted: false,
    };

    if (mediaUrl) {
      where.mediaUrl = {
        contains: mediaUrl,
      };
    }

    return this.prisma.message.findMany({
      where,
      skip: options?.offset || 0,
      take: options?.limit || 50,
      orderBy: { timestamp: 'desc' },
    });
  }

  // Otimização: buscar por tamanho de arquivo usando índice
  async findByFileLength(
    sessionId: string,
    filters?: {
      minLength?: bigint;
      maxLength?: bigint;
      limit?: number;
      offset?: number;
    },
  ): Promise<Message[]> {
    const where: any = {
      sessionId,
      fileLength: { not: null },
      isDeleted: false,
    };

    if (filters?.minLength) {
      where.fileLength = {
        ...where.fileLength,
        gte: filters.minLength,
      };
    }

    if (filters?.maxLength) {
      where.fileLength = {
        ...where.fileLength,
        lte: filters.maxLength,
      };
    }

    return this.prisma.message.findMany({
      where,
      skip: filters?.offset || 0,
      take: filters?.limit || 50,
      orderBy: { timestamp: 'desc' },
    });
  }

  // Otimização: buscar por status usando índice
  async findByStatus(
    sessionId: string,
    status?: MessageStatus,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<Message[]> {
    const where: any = {
      sessionId,
      isDeleted: false,
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.message.findMany({
      where,
      skip: options?.offset || 0,
      take: options?.limit || 50,
      orderBy: { timestamp: 'desc' },
    });
  }

  // Otimização: buscar por tipo de mensagem usando índice
  async findByMessageType(
    sessionId: string,
    messageType: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        sessionId,
        messageType,
        isDeleted: false,
      },
      skip: options?.offset || 0,
      take: options?.limit || 50,
      orderBy: { timestamp: 'desc' },
    });
  }

  // Otimização: busca por timestamp usando índice
  async findByTimestampRange(
    sessionId: string,
    startDate: Date,
    endDate: Date,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        sessionId,
        timestamp: {
          gte: BigInt(startDate.getTime()),
          lte: BigInt(endDate.getTime()),
        },
        isDeleted: false,
      },
      skip: options?.offset || 0,
      take: options?.limit || 50,
      orderBy: { timestamp: 'desc' },
    });
  }

  findBySessionId(
    sessionId: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        sessionId,
        isDeleted: false,
      },
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
        isDeleted: false,
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { timestamp: 'desc' },
    });
  }

  // Otimização: busca composta usando múltiplos índices
  async findComplex(
    sessionId: string,
    filters: {
      chatId?: string;
      messageType?: string;
      status?: MessageStatus;
      textSearch?: string;
      hasMedia?: boolean;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ): Promise<Message[]> {
    const where: any = {
      sessionId,
      isDeleted: false,
    };

    if (filters.chatId) where.chatId = filters.chatId;
    if (filters.messageType) where.messageType = filters.messageType;
    if (filters.status) where.status = filters.status;

    if (filters.textSearch) {
      where.textContent = {
        contains: filters.textSearch,
        mode: 'insensitive',
      };
    }

    if (filters.hasMedia !== undefined) {
      where.mediaUrl = filters.hasMedia ? { not: null } : null;
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate)
        where.timestamp.gte = BigInt(filters.startDate.getTime());
      if (filters.endDate)
        where.timestamp.lte = BigInt(filters.endDate.getTime());
    }

    return this.prisma.message.findMany({
      where,
      skip: filters.offset || 0,
      take: filters.limit || 50,
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

  // Otimização: update de status em batch usando índice
  async updateStatusBatch(
    updates: Array<{
      sessionId: string;
      messageId: string;
      status: MessageStatus;
    }>,
  ): Promise<number> {
    if (updates.length === 0) return 0;

    const result = await this.prisma.$transaction(async (tx) => {
      let count = 0;
      for (const update of updates) {
        await tx.message.update({
          where: {
            sessionId_messageId: {
              sessionId: update.sessionId,
              messageId: update.messageId,
            },
          },
          data: { status: update.status },
        });
        count++;
      }
      return count;
    });

    return result;
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

  async markAsDeletedBatch(
    deletes: Array<{
      sessionId: string;
      messageId: string;
    }>,
  ): Promise<number> {
    if (deletes.length === 0) return 0;

    const result = await this.prisma.$transaction(async (tx) => {
      let count = 0;
      for (const del of deletes) {
        await tx.message.update({
          where: {
            sessionId_messageId: {
              sessionId: del.sessionId,
              messageId: del.messageId,
            },
          },
          data: { isDeleted: true },
        });
        count++;
      }
      return count;
    });

    return result;
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

  async deleteByChatId(sessionId: string, chatId: string): Promise<number> {
    const result = await this.prisma.message.deleteMany({
      where: {
        sessionId,
        chatId,
      },
    });
    return result.count;
  }

  async deleteBySessionId(sessionId: string): Promise<number> {
    const result = await this.prisma.message.deleteMany({
      where: {
        sessionId,
      },
    });
    return result.count;
  }

  // Otimização: contagem usando índices
  async getCountByStatus(
    sessionId: string,
  ): Promise<Record<MessageStatus, number>> {
    const counts = await this.prisma.message.groupBy({
      by: ['status'],
      where: {
        sessionId,
        isDeleted: false,
      },
      _count: {
        id: true,
      },
    });

    return counts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<MessageStatus, number>,
    );
  }

  async getMetrics(
    sessionId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{
    totalMessages: number;
    messagesWithMedia: number;
    totalFileSize: bigint;
    averageFileSize: number;
    statusDistribution: Record<MessageStatus, number>;
  }> {
    const where: any = {
      sessionId,
      isDeleted: false,
    };

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate)
        where.timestamp.gte = BigInt(options.startDate.getTime());
      if (options.endDate)
        where.timestamp.lte = BigInt(options.endDate.getTime());
    }

    const [total, mediaStats, statusStats] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.aggregate({
        where: { ...where, mediaUrl: { not: null } },
        _sum: { fileLength: true },
        _count: { id: true },
      }),
      this.prisma.message.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
    ]);

    const statusDistribution = statusStats.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<MessageStatus, number>,
    );

    return {
      totalMessages: total,
      messagesWithMedia: mediaStats._count.id,
      totalFileSize: mediaStats._sum.fileLength || BigInt(0),
      averageFileSize:
        mediaStats._count.id > 0
          ? Number(mediaStats._sum.fileLength) / mediaStats._count.id
          : 0,
      statusDistribution,
    };
  }
}
