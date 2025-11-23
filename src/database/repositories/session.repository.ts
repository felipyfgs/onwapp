import { Injectable } from '@nestjs/common';
import { Session, Prisma } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../database.service';

@Injectable()
export class SessionRepository extends BaseRepository<Session> {
  constructor(prisma: DatabaseService) {
    super(prisma);
  }

  async create(data: Prisma.SessionCreateInput): Promise<Session> {
    return this.prisma.session.create({ data });
  }

  async findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { id } });
  }

  async findAll(): Promise<Session[]> {
    return this.prisma.session.findMany();
  }

  async findAllConnected(): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: { status: 'connected' },
    });
  }

  async update(
    id: string,
    data: Prisma.SessionUpdateInput,
  ): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Session> {
    return this.prisma.session.delete({ where: { id } });
  }
}
