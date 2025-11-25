import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ChatwootDto } from './dto/chatwoot.dto';

@Injectable()
export class ChatwootRepository {
  constructor(private readonly prisma: DatabaseService) {}

  async findBySessionId(sessionId: string) {
    return this.prisma.chatwoot.findUnique({
      where: { sessionId },
    });
  }

  async upsert(sessionId: string, data: ChatwootDto) {
    return this.prisma.chatwoot.upsert({
      where: { sessionId },
      create: {
        sessionId,
        ...data,
      },
      update: data,
    });
  }

  async delete(sessionId: string) {
    return this.prisma.chatwoot.delete({
      where: { sessionId },
    });
  }

  async findAllEnabled() {
    return this.prisma.chatwoot.findMany({
      where: { enabled: true },
      include: { session: true },
    });
  }
}
