import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageStatus } from '@prisma/client';

interface ContactData {
  remoteJid: string;
  name?: string;
  profilePicUrl?: string;
}

interface ChatData {
  remoteJid: string;
  name?: string;
  unreadCount?: number;
  lastMessageTimestamp?: bigint | number | string;
  archived?: boolean;
  pinned?: boolean;
  muted?: boolean;
}

interface MessageData {
  remoteJid: string;
  messageId: string;
  fromMe: boolean;
  senderJid?: string;
  senderName?: string;
  timestamp: bigint | number | string;
  messageType: string;
  textContent?: string | null;
  mediaUrl?: string | null;
  metadata: Record<string, any>;
}

@Injectable()
export class PersistenceService {
  private readonly logger = new Logger(PersistenceService.name);

  constructor(private prisma: PrismaService) {}

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
          profilePicUrl: contactData.profilePicUrl,
        },
        update: {
          name: contactData.name,
          profilePicUrl: contactData.profilePicUrl,
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
      if (chatData.unreadCount !== undefined)
        updateData.unreadCount = chatData.unreadCount;
      if (chatData.archived !== undefined)
        updateData.archived = chatData.archived;
      if (chatData.pinned !== undefined) updateData.pinned = chatData.pinned;
      if (chatData.muted !== undefined) updateData.muted = chatData.muted;
      if (chatData.lastMessageTimestamp !== undefined) {
        updateData.lastMessageTimestamp = BigInt(
          chatData.lastMessageTimestamp.toString(),
        );
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
          unreadCount: chatData.unreadCount || 0,
          lastMessageTimestamp: chatData.lastMessageTimestamp
            ? BigInt(chatData.lastMessageTimestamp.toString())
            : null,
          archived: chatData.archived || false,
          pinned: chatData.pinned || false,
          muted: chatData.muted || false,
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
        lastMessageTimestamp: messageData.timestamp,
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
          senderName: messageData.senderName,
          timestamp: BigInt(messageData.timestamp.toString()),
          messageType: messageData.messageType,
          content,
          status: messageData.fromMe
            ? MessageStatus.sent
            : MessageStatus.delivered,
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
          isDeleted: true,
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
    if (filters?.unreadOnly) where.unreadCount = { gt: 0 };

    return this.prisma.chat.findMany({
      where,
      orderBy: { lastMessageTimestamp: 'desc' },
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
    const where: any = { chatId, isDeleted: false };

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
              profilePicUrl: contact.profilePicUrl,
            },
            update: {
              name: contact.name,
              profilePicUrl: contact.profilePicUrl,
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
              unreadCount: chat.unreadCount || 0,
              lastMessageTimestamp: chat.lastMessageTimestamp
                ? BigInt(chat.lastMessageTimestamp.toString())
                : null,
              archived: chat.archived || false,
              pinned: chat.pinned || false,
              muted: chat.muted || false,
            },
            update: {
              name: chat.name,
              unreadCount: chat.unreadCount,
              lastMessageTimestamp: chat.lastMessageTimestamp
                ? BigInt(chat.lastMessageTimestamp.toString())
                : null,
              archived: chat.archived,
              pinned: chat.pinned,
              muted: chat.muted,
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
              lastMessageTimestamp: msg.timestamp,
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
            senderName: msg.senderName,
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
