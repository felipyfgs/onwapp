import { Injectable } from '@nestjs/common';
import { Session, Prisma } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../database.service';

@Injectable()
export class SessionRepository extends BaseRepository {
  constructor(prisma: DatabaseService) {
    super(prisma);
  }

  create(data: Prisma.SessionCreateInput): Promise<Session> {
    return this.prisma.session.create({ data });
  }

  findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { id },
    });
  }

  findAll(): Promise<Session[]> {
    return this.prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllConnected(): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: {
        status: {
          in: ['connected', 'connecting'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, data: Prisma.SessionUpdateInput): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data,
    });
  }

  delete(id: string): Promise<Session> {
    return this.prisma.session.delete({
      where: { id },
    });
  }
}
