import { Injectable, Logger } from '@nestjs/common';
import { Chatwoot, Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { SetChatwootConfigDto } from './dto';

/**
 * Repository for Chatwoot configuration data access
 *
 * Handles all database operations for Chatwoot integration settings.
 */
@Injectable()
export class ChatwootRepository {
  private readonly logger = new Logger(ChatwootRepository.name);

  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Find Chatwoot configuration by session ID
   */
  async findBySessionId(sessionId: string): Promise<Chatwoot | null> {
    return this.prisma.chatwoot.findUnique({
      where: { sessionId },
    });
  }

  /**
   * Create or update Chatwoot configuration for a session
   */
  async upsert(
    sessionId: string,
    data: SetChatwootConfigDto,
  ): Promise<Chatwoot> {
    const createData: Prisma.ChatwootCreateInput = {
      session: { connect: { id: sessionId } },
      enabled: data.enabled,
      accountId: data.accountId,
      token: data.token,
      url: data.url,
      inbox: data.inbox,
      signMsg: data.signMsg ?? false,
      signDelimiter: data.signDelimiter,
      reopen: data.reopen ?? false,
      pending: data.pending ?? false,
      mergeBrazil: data.mergeBrazil ?? false,
      importContacts: data.importContacts ?? false,
      importMessages: data.importMessages ?? false,
      importDays: data.importDays,
      organization: data.organization,
      logo: data.logo,
      ignoreJids: data.ignoreJids ?? [],
    };

    const updateData: Prisma.ChatwootUpdateInput = {
      enabled: data.enabled,
      accountId: data.accountId,
      token: data.token,
      url: data.url,
      inbox: data.inbox,
      signMsg: data.signMsg,
      signDelimiter: data.signDelimiter,
      reopen: data.reopen,
      pending: data.pending,
      mergeBrazil: data.mergeBrazil,
      importContacts: data.importContacts,
      importMessages: data.importMessages,
      importDays: data.importDays,
      organization: data.organization,
      logo: data.logo,
      ignoreJids: data.ignoreJids,
    };

    return this.prisma.chatwoot.upsert({
      where: { sessionId },
      create: createData,
      update: updateData,
    });
  }

  /**
   * Delete Chatwoot configuration for a session
   */
  async delete(sessionId: string): Promise<Chatwoot> {
    return this.prisma.chatwoot.delete({
      where: { sessionId },
    });
  }

  /**
   * Find all enabled Chatwoot configurations with their sessions
   */
  async findAllEnabled() {
    return this.prisma.chatwoot.findMany({
      where: { enabled: true },
      include: { session: true },
    });
  }
}
