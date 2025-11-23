import { Injectable } from '@nestjs/common';
import { Contact, Prisma } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../database.service';

@Injectable()
export class ContactRepository extends BaseRepository<Contact> {
  constructor(prisma: DatabaseService) {
    super(prisma);
  }

  async create(data: Prisma.ContactCreateInput): Promise<Contact> {
    return this.prisma.contact.create({ data });
  }

  async createMany(data: Prisma.ContactCreateManyInput[]): Promise<number> {
    const result = await this.prisma.contact.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }

  async upsert(
    sessionId: string,
    remoteJid: string,
    create: Prisma.ContactCreateInput,
    update: Prisma.ContactUpdateInput,
  ): Promise<Contact> {
    return this.prisma.contact.upsert({
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

  async findBySessionId(sessionId: string, options?: {
    skip?: number;
    take?: number;
  }): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: { sessionId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: 'asc' },
    });
  }

  async findByRemoteJid(
    sessionId: string,
    remoteJid: string,
  ): Promise<Contact | null> {
    return this.prisma.contact.findUnique({
      where: {
        sessionId_remoteJid: {
          sessionId,
          remoteJid,
        },
      },
    });
  }
}
