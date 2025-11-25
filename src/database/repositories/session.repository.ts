import { Injectable } from '@nestjs/common';
import { Session, Prisma, Webhook, Chatwoot, Proxy } from '@prisma/client';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../database.service';

export type SessionWithConfigs = Session & {
  webhook?: Webhook | null;
  chatwoot?: Chatwoot | null;
  proxy?: Proxy | null;
};

const SESSION_INCLUDE = {
  webhook: true,
  chatwoot: true,
  proxy: true,
};

@Injectable()
export class SessionRepository extends BaseRepository {
  constructor(prisma: DatabaseService) {
    super(prisma);
  }

  create(data: Prisma.SessionCreateInput): Promise<Session> {
    return this.prisma.session.create({ data });
  }

  createWithConfigs(
    data: Prisma.SessionCreateInput,
  ): Promise<SessionWithConfigs> {
    return this.prisma.session.create({
      data,
      include: SESSION_INCLUDE,
    });
  }

  findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { id },
    });
  }

  findByIdWithConfigs(id: string): Promise<SessionWithConfigs | null> {
    return this.prisma.session.findUnique({
      where: { id },
      include: SESSION_INCLUDE,
    });
  }

  findAll(): Promise<Session[]> {
    return this.prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllWithConfigs(): Promise<SessionWithConfigs[]> {
    return this.prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
      include: SESSION_INCLUDE,
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

  findAllConnectedWithConfigs(): Promise<SessionWithConfigs[]> {
    return this.prisma.session.findMany({
      where: {
        status: {
          in: ['connected', 'connecting'],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: SESSION_INCLUDE,
    });
  }

  update(id: string, data: Prisma.SessionUpdateInput): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data,
    });
  }

  updateWithConfigs(
    id: string,
    data: Prisma.SessionUpdateInput,
  ): Promise<SessionWithConfigs> {
    return this.prisma.session.update({
      where: { id },
      data,
      include: SESSION_INCLUDE,
    });
  }

  delete(id: string): Promise<Session> {
    return this.prisma.session.delete({
      where: { id },
    });
  }
}
