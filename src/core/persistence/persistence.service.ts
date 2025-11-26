import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { MessageStatus, Prisma } from '@prisma/client';
import { WAMessageKey } from '../../common/interfaces';

interface ContactData {
  remoteJid: string;
  name?: string;
  avatarUrl?: string;
}

interface ChatData {
  remoteJid: string;
  name?: string;
  unread?: number;
  lastMessageTs?: bigint | number | string;
  archived?: boolean;
  pinned?: boolean;
  muted?: boolean;
}

interface MessageData {
  remoteJid: string;
  messageId: string;
  fromMe: boolean;
  senderJid?: string;
  sender?: string;
  timestamp: bigint | number | string;
  messageType: string;
  textContent?: string | null;
  mediaUrl?: string | null;
  metadata: Record<string, any>;
  // Chatwoot tracking
  cwConversationId?: number | null;
  cwMessageId?: number | null;
  cwInboxId?: number | null;
  cwContactId?: number | null;
  // WhatsApp message key for reply/edit/delete
  waMessageKey?: WAMessageKey | null;
  // Original WhatsApp message content for replies
  waMessage?: Record<string, unknown> | null;
}

@Injectable()
export class PersistenceService {
  private readonly logger = new Logger(PersistenceService.name);

  constructor(private prisma: DatabaseService) {}

  async createOrUpdateContact(
    sessionId: string,
    contactData: ContactData,
  ): Promise<void> {
    try {
      await this.prisma.contact.upsert({
        where: {
          sessionId_remoteJid: {
            sessionId,
            remoteJid: contactData.remoteJid,
          },
        },
        create: {
          sessionId,
          remoteJid: contactData.remoteJid,
          name: contactData.name,
          avatarUrl: contactData.avatarUrl,
        },
        update: {
          name: contactData.name,
          avatarUrl: contactData.avatarUrl,
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao criar/atualizar contato: ${error.message}`,
        error.stack,
      );
    }
  }

  async createOrUpdateChat(
    sessionId: string,
    chatData: ChatData,
  ): Promise<string | null> {
    try {
      const updateData: any = {};

      if (chatData.name !== undefined) updateData.name = chatData.name;
      if (chatData.unread !== undefined) updateData.unread = chatData.unread;
      if (chatData.archived !== undefined)
        updateData.archived = !!chatData.archived;
      if (chatData.pinned !== undefined) updateData.pinned = !!chatData.pinned;
      if (chatData.muted !== undefined) updateData.muted = !!chatData.muted;
      if (chatData.lastMessageTs !== undefined) {
        updateData.lastMessageTs = BigInt(chatData.lastMessageTs.toString());
      }

      const chat = await this.prisma.chat.upsert({
        where: {
          sessionId_remoteJid: {
            sessionId,
            remoteJid: chatData.remoteJid,
          },
        },
        create: {
          sessionId,
          remoteJid: chatData.remoteJid,
          name: chatData.name,
          unread: chatData.unread || 0,
          lastMessageTs: chatData.lastMessageTs
            ? BigInt(chatData.lastMessageTs.toString())
            : null,
          archived: !!chatData.archived,
          pinned: !!chatData.pinned,
          muted: !!chatData.muted,
        },
        update: updateData,
      });

      return chat.id;
    } catch (error) {
      this.logger.error(
        `Erro ao criar/atualizar chat: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async createMessage(
    sessionId: string,
    messageData: MessageData,
  ): Promise<void> {
    try {
      const chatId = await this.createOrUpdateChat(sessionId, {
        remoteJid: messageData.remoteJid,
        lastMessageTs: messageData.timestamp,
      });

      if (!chatId) {
        throw new Error('Falha ao obter ou criar chat');
      }

      const content = {
        textContent: messageData.textContent,
        mediaUrl: messageData.mediaUrl,
        ...messageData.metadata,
      };

      await this.prisma.message.create({
        data: {
          sessionId,
          chatId,
          remoteJid: messageData.remoteJid,
          messageId: messageData.messageId,
          fromMe: messageData.fromMe,
          senderJid: messageData.senderJid,
          sender: messageData.sender,
          timestamp: BigInt(messageData.timestamp.toString()),
          messageType: messageData.messageType,
          content,
          status: messageData.fromMe
            ? MessageStatus.sent
            : MessageStatus.delivered,
          // Chatwoot tracking
          cwConversationId: messageData.cwConversationId,
          cwMessageId: messageData.cwMessageId,
          cwInboxId: messageData.cwInboxId,
          cwContactId: messageData.cwContactId,
          // WhatsApp message key for reply/edit/delete
          waMessageKey: messageData.waMessageKey
            ? (messageData.waMessageKey as unknown as Prisma.InputJsonValue)
            : undefined,
          // Original WhatsApp message content for replies
          waMessage: messageData.waMessage
            ? (messageData.waMessage as unknown as Prisma.InputJsonValue)
            : undefined,
        },
      });

      this.logger.debug(
        `Mensagem persistida: ${messageData.messageId} (${messageData.messageType})`,
      );
    } catch (error) {
      if (error.code === 'P2002') {
        this.logger.debug(
          `Mensagem duplicada ignorada: ${messageData.messageId}`,
        );
      } else {
        this.logger.error(
          `Erro ao criar mensagem: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  async updateMessageStatus(
    sessionId: string,
    messageId: string,
    status: MessageStatus,
  ): Promise<void> {
    try {
      await this.prisma.message.updateMany({
        where: {
          sessionId,
          messageId,
        },
        data: {
          status,
        },
      });

      this.logger.debug(
        `Status da mensagem atualizado: ${messageId} -> ${status}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar status da mensagem: ${error.message}`,
        error.stack,
      );
    }
  }

  async markMessageAsDeleted(
    sessionId: string,
    messageId: string,
  ): Promise<void> {
    try {
      await this.prisma.message.updateMany({
        where: {
          sessionId,
          messageId,
        },
        data: {
          deleted: true,
        },
      });

      this.logger.debug(`Mensagem marcada como deletada: ${messageId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao marcar mensagem como deletada: ${error.message}`,
        error.stack,
      );
    }
  }

  async updateMessageContent(
    sessionId: string,
    messageId: string,
    newContent: string,
  ): Promise<void> {
    try {
      await this.prisma.message.updateMany({
        where: {
          sessionId,
          messageId,
        },
        data: {
          textContent: newContent,
        },
      });

      this.logger.debug(`Conteúdo da mensagem atualizado: ${messageId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar conteúdo da mensagem: ${error.message}`,
        error.stack,
      );
    }
  }

  async updateMessageChatwoot(
    sessionId: string,
    messageId: string,
    chatwootData: {
      cwConversationId?: number;
      cwMessageId?: number;
      cwInboxId?: number;
      cwContactId?: number;
    },
  ): Promise<void> {
    try {
      const result = await this.prisma.message.updateMany({
        where: {
          sessionId,
          messageId,
        },
        data: chatwootData,
      });

      // Retry if message not found (race condition with messages.upsert)
      if (result.count === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await this.prisma.message.updateMany({
          where: {
            sessionId,
            messageId,
          },
          data: chatwootData,
        });
      }
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar dados Chatwoot: ${error.message}`,
        error.stack,
      );
    }
  }

  async findMessageByChatwootId(
    sessionId: string,
    cwMessageId: number,
  ): Promise<{
    messageId: string;
    remoteJid: string;
    waMessageKey: WAMessageKey | null;
    waMessage: Record<string, unknown> | null;
  } | null> {
    try {
      const message = await this.prisma.message.findFirst({
        where: {
          sessionId,
          cwMessageId,
        },
        select: {
          messageId: true,
          remoteJid: true,
          waMessageKey: true,
          waMessage: true,
        },
      });
      if (!message) return null;
      return {
        messageId: message.messageId,
        remoteJid: message.remoteJid,
        waMessageKey: message.waMessageKey as WAMessageKey | null,
        waMessage: message.waMessage as Record<string, unknown> | null,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar mensagem por Chatwoot ID: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Find all messages linked to the same Chatwoot message ID
   * Used for deleting multiple WhatsApp messages when a Chatwoot message with multiple attachments is deleted
   */
  async findAllMessagesByChatwootId(
    sessionId: string,
    cwMessageId: number,
  ): Promise<
    Array<{
      messageId: string;
      remoteJid: string;
      waMessageKey: WAMessageKey | null;
    }>
  > {
    try {
      const messages = await this.prisma.message.findMany({
        where: {
          sessionId,
          cwMessageId,
          deleted: false,
        },
        select: {
          messageId: true,
          remoteJid: true,
          waMessageKey: true,
        },
      });
      return messages.map((m) => ({
        messageId: m.messageId,
        remoteJid: m.remoteJid,
        waMessageKey: m.waMessageKey as WAMessageKey | null,
      }));
    } catch (error) {
      this.logger.error(
        `Erro ao buscar mensagens por Chatwoot ID: ${error.message}`,
      );
      return [];
    }
  }

  async findMessageByWAId(
    sessionId: string,
    waMessageId: string,
  ): Promise<{
    messageId: string;
    remoteJid: string;
    waMessageKey: WAMessageKey | null;
    waMessage: Record<string, unknown> | null;
    cwMessageId: number | null;
    cwConversationId: number | null;
  } | null> {
    try {
      const message = await this.prisma.message.findFirst({
        where: {
          sessionId,
          messageId: waMessageId,
        },
        select: {
          messageId: true,
          remoteJid: true,
          waMessageKey: true,
          waMessage: true,
          cwMessageId: true,
          cwConversationId: true,
        },
      });
      if (!message) return null;
      return {
        messageId: message.messageId,
        remoteJid: message.remoteJid,
        waMessageKey: message.waMessageKey as WAMessageKey | null,
        waMessage: message.waMessage as Record<string, unknown> | null,
        cwMessageId: message.cwMessageId,
        cwConversationId: message.cwConversationId,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar mensagem por WA ID: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async getChats(
    sessionId: string,
    filters?: {
      archived?: boolean;
      pinned?: boolean;
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { sessionId };

    if (filters?.archived !== undefined) where.archived = filters.archived;
    if (filters?.pinned !== undefined) where.pinned = filters.pinned;
    if (filters?.unreadOnly) where.unread = { gt: 0 };

    return this.prisma.chat.findMany({
      where,
      orderBy: { lastMessageTs: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getChat(sessionId: string, chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    if (!chat || chat.sessionId !== sessionId) {
      throw new NotFoundException('Chat não encontrado');
    }

    return chat;
  }

  async getMessages(
    chatId: string,
    filters?: {
      fromMe?: boolean;
      messageType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
      order?: 'asc' | 'desc';
    },
  ) {
    const where: any = { chatId, deleted: false };

    if (filters?.fromMe !== undefined) where.fromMe = filters.fromMe;
    if (filters?.messageType) where.messageType = filters.messageType;

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate)
        where.timestamp.gte = BigInt(filters.startDate.getTime());
      if (filters.endDate)
        where.timestamp.lte = BigInt(filters.endDate.getTime());
    }

    return this.prisma.message.findMany({
      where,
      orderBy: { timestamp: filters?.order || 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });
  }

  async getContacts(
    sessionId: string,
    filters?: {
      search?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { sessionId };

    if (filters?.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    return this.prisma.contact.findMany({
      where,
      orderBy: { name: 'asc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    });
  }

  async createContactsBatch(
    sessionId: string,
    contacts: ContactData[],
  ): Promise<number> {
    if (contacts.length === 0) return 0;

    try {
      let processedCount = 0;

      await this.prisma.$transaction(async (tx) => {
        for (const contact of contacts) {
          await tx.contact.upsert({
            where: {
              sessionId_remoteJid: {
                sessionId,
                remoteJid: contact.remoteJid,
              },
            },
            create: {
              sessionId,
              remoteJid: contact.remoteJid,
              name: contact.name,
              avatarUrl: contact.avatarUrl,
            },
            update: {
              name: contact.name,
              avatarUrl: contact.avatarUrl,
            },
          });
          processedCount++;
        }
      });

      this.logger.debug(
        `Batch de contatos persistido: ${processedCount} contatos`,
      );
      return processedCount;
    } catch (error) {
      this.logger.error(
        `Erro ao persistir batch de contatos: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  async createChatsBatch(
    sessionId: string,
    chats: ChatData[],
  ): Promise<number> {
    if (chats.length === 0) return 0;

    try {
      let processedCount = 0;

      await this.prisma.$transaction(async (tx) => {
        for (const chat of chats) {
          await tx.chat.upsert({
            where: {
              sessionId_remoteJid: {
                sessionId,
                remoteJid: chat.remoteJid,
              },
            },
            create: {
              sessionId,
              remoteJid: chat.remoteJid,
              name: chat.name,
              unread: chat.unread || 0,
              lastMessageTs: chat.lastMessageTs
                ? BigInt(chat.lastMessageTs.toString())
                : null,
              archived: !!chat.archived,
              pinned: !!chat.pinned,
              muted: !!chat.muted,
            },
            update: {
              name: chat.name,
              unread: chat.unread,
              lastMessageTs: chat.lastMessageTs
                ? BigInt(chat.lastMessageTs.toString())
                : null,
              archived: !!chat.archived,
              pinned: !!chat.pinned,
              muted: !!chat.muted,
            },
          });
          processedCount++;
        }
      });

      this.logger.debug(`Batch de chats persistido: ${processedCount} chats`);
      return processedCount;
    } catch (error) {
      this.logger.error(
        `Erro ao persistir batch de chats: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  async createMessagesBatch(
    sessionId: string,
    messages: MessageData[],
  ): Promise<number> {
    if (messages.length === 0) return 0;

    const CHUNK_SIZE = 100;
    let totalProcessed = 0;

    try {
      for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
        const chunk = messages.slice(i, i + CHUNK_SIZE);

        const chatIds = new Map<string, string>();
        for (const msg of chunk) {
          if (!chatIds.has(msg.remoteJid)) {
            const chatId = await this.createOrUpdateChat(sessionId, {
              remoteJid: msg.remoteJid,
              lastMessageTs: msg.timestamp,
            });
            if (chatId) {
              chatIds.set(msg.remoteJid, chatId);
            }
          }
        }

        const messagesToInsert = chunk
          .filter((msg) => chatIds.has(msg.remoteJid))
          .map((msg) => ({
            sessionId,
            chatId: chatIds.get(msg.remoteJid)!,
            remoteJid: msg.remoteJid,
            messageId: msg.messageId,
            fromMe: msg.fromMe,
            senderJid: msg.senderJid,
            sender: msg.sender,
            timestamp: BigInt(msg.timestamp.toString()),
            messageType: msg.messageType,
            content: {
              textContent: msg.textContent,
              mediaUrl: msg.mediaUrl,
              ...msg.metadata,
            },
            status: msg.fromMe ? MessageStatus.sent : MessageStatus.delivered,
          }));

        if (messagesToInsert.length > 0) {
          const result = await this.prisma.message.createMany({
            data: messagesToInsert,
            skipDuplicates: true,
          });
          totalProcessed += result.count;
        }
      }

      this.logger.debug(
        `Batch de mensagens persistido: ${totalProcessed} mensagens`,
      );
      return totalProcessed;
    } catch (error) {
      this.logger.error(
        `Erro ao persistir batch de mensagens: ${error.message}`,
        error.stack,
      );
      return totalProcessed;
    }
  }
}
