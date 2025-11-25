import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database.service';
import { MessageStatus } from '@prisma/client';

interface DeliveryTimeMetric {
  messageId: string;
  deliveryTimeMs: number;
}

interface StatusMetric {
  status: MessageStatus;
  count: number;
}

@Injectable()
export class MessageStatusHistoryRepository {
  constructor(private prisma: DatabaseService) {}

  async create(data: {
    messageId: string;
    status: MessageStatus;
    timestamp: bigint;
    recipientJid?: string;
  }) {
    return this.prisma.messageStatusHistory.create({
      data,
    });
  }

  async findByMessageId(
    messageId: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ) {
    return this.prisma.messageStatusHistory.findMany({
      where: { messageId },
      orderBy: { timestamp: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  async findByMessageIdAndStatus(messageId: string, status: MessageStatus) {
    return this.prisma.messageStatusHistory.findMany({
      where: {
        messageId,
        status,
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findByRecipientJid(
    recipientJid: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: any = { recipientJid };

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate)
        where.timestamp.gte = BigInt(options.startDate.getTime());
      if (options.endDate)
        where.timestamp.lte = BigInt(options.endDate.getTime());
    }

    return this.prisma.messageStatusHistory.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  async getStatusMetrics(
    sessionId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<StatusMetric[]> {
    const where: any = {
      message: {
        sessionId,
        isDeleted: false,
      },
    };

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate)
        where.timestamp.gte = BigInt(options.startDate.getTime());
      if (options.endDate)
        where.timestamp.lte = BigInt(options.endDate.getTime());
    }

    // Aggregate para métricas por status
    const metrics = await this.prisma.messageStatusHistory.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    return metrics.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));
  }

  async getDeliveryTimeMetrics(
    sessionId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<DeliveryTimeMetric[]> {
    // Buscar mensagens com status transitions
    const messagesWithHistory = await this.prisma.message.findMany({
      where: {
        sessionId,
        isDeleted: false,
        ...(options?.startDate && {
          timestamp: { gte: BigInt(options.startDate.getTime()) },
        }),
        ...(options?.endDate && {
          timestamp: { lte: BigInt(options.endDate.getTime()) },
        }),
      },
      include: {
        statusHistory: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    // Calcular tempo de entrega médio
    const metrics: DeliveryTimeMetric[] = [];
    for (const message of messagesWithHistory) {
      const pendingStatus = message.statusHistory.find(
        (h) => h.status === 'pending',
      );
      const deliveredStatus = message.statusHistory.find(
        (h) => h.status === 'delivered',
      );

      if (pendingStatus && deliveredStatus) {
        const deliveryTime =
          Number(deliveredStatus.timestamp) - Number(pendingStatus.timestamp);
        metrics.push({
          messageId: message.id,
          deliveryTimeMs: deliveryTime,
        });
      }
    }

    return metrics;
  }

  async createBatch(
    dataArray: Array<{
      messageId: string;
      status: MessageStatus;
      timestamp: bigint;
      recipientJid?: string;
    }>,
  ) {
    if (dataArray.length === 0) return [];

    return this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const data of dataArray) {
        const result = await tx.messageStatusHistory.create({ data });
        results.push(result);
      }
      return results;
    });
  }

  async deleteByMessageId(messageId: string) {
    return this.prisma.messageStatusHistory.deleteMany({
      where: { messageId },
    });
  }

  async deleteBySessionId(sessionId: string) {
    // Primeiro encontrar todos os messageIds da sessão
    const messages = await this.prisma.message.findMany({
      where: { sessionId },
      select: { id: true },
    });

    const messageIds = messages.map((m) => m.id);

    // Deletar histórico em batch
    return this.prisma.messageStatusHistory.deleteMany({
      where: {
        messageId: {
          in: messageIds,
        },
      },
    });
  }
}
