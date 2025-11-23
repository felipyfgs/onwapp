import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  WASocket,
} from 'whaileys';
import { Boom } from '@hapi/boom';
import { DatabaseService } from '../database/database.service';
import * as qrcode from 'qrcode-terminal';
import { useAuthState } from './auth-state';
import { WebhooksService } from '../webhooks/webhooks.service';
import { PersistenceService } from '../persistence/persistence.service';
import { HistorySyncService } from '../persistence/history-sync.service';
import { SettingsService } from '../settings/settings.service';
import { parseMessageContent } from '../persistence/utils/message-parser';
import { MessageStatus } from '@prisma/client';

interface SessionSocket {
  socket: WASocket;
  qrCode?: string;
  isNewLogin: boolean;
  logoutAttempts: number;
}

interface DisconnectContext {
  sessionId: string;
  statusCode: number;
  isLoggedOut: boolean;
  isRestartRequired: boolean;
  isBadSession: boolean;
  logoutAttempts: number;
  isNewLogin: boolean;
}

const RECONNECT_DELAYS = {
  DEFAULT: 3000,
  RESTART_REQUIRED: 10000,
} as const;

const MAX_LOGOUT_ATTEMPTS = 2;
const ACTIVE_SESSION_STATUSES: Array<'connected' | 'connecting'> = [
  'connected',
  'connecting',
];

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private sessions: Map<string, SessionSocket> = new Map();

  constructor(
    private prisma: DatabaseService,
    @Inject(forwardRef(() => WebhooksService))
    private webhooksService: WebhooksService,
    @Inject(forwardRef(() => PersistenceService))
    private persistenceService: PersistenceService,
    @Inject(forwardRef(() => HistorySyncService))
    private historySyncService: HistorySyncService,
    @Inject(forwardRef(() => SettingsService))
    private settingsService: SettingsService,
  ) {}

  private formatSessionId(sessionId: string): string {
    return sessionId.slice(0, 8);
  }

  private createSilentLogger() {
    return {
      level: 'silent',
      fatal: (...args: any[]) => {},
      error: (...args: any[]) => {},
      warn: (...args: any[]) => {},
      info: (...args: any[]) => {},
      debug: (...args: any[]) => {},
      trace: (...args: any[]) => {},
      silent: (...args: any[]) => {},
      child: () => this.createSilentLogger(),
    };
  }

  private extractPhoneNumber(socket: WASocket): string | null {
    return socket.user?.id ? socket.user.id.split(':')[0] : null;
  }

  private shouldReconnectSession(
    statusCode: number,
    logoutAttempts: number,
    isNewLogin: boolean,
  ): boolean {
    const isLoggedOut = statusCode === DisconnectReason.loggedOut;
    const isRestartRequired = statusCode === DisconnectReason.restartRequired;
    const isBadSession = statusCode === DisconnectReason.badSession;

    return (
      (!isLoggedOut || logoutAttempts < MAX_LOGOUT_ATTEMPTS) ||
      isRestartRequired ||
      isBadSession
    );
  }

  private getReconnectDelay(statusCode: number): number {
    return statusCode === DisconnectReason.restartRequired
      ? RECONNECT_DELAYS.RESTART_REQUIRED
      : RECONNECT_DELAYS.DEFAULT;
  }

  private async updateSessionStatus(
    sessionId: string,
    data: any,
  ): Promise<void> {
    try {
      await this.prisma.session.update({
        where: { id: sessionId },
        data,
      });
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Operation: updateSessionStatus | Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  private async clearSessionCredentials(sessionId: string): Promise<void> {
    try {
      await this.prisma.authState.deleteMany({
        where: { sessionId },
      });
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Operation: clearSessionCredentials | Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  private scheduleReconnect(sessionId: string, delay: number): void {
    setTimeout(() => {
      this.createSocket(sessionId).catch((err) =>
        this.logger.error(
          `[${sessionId}] Operation: scheduleReconnect | Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          err,
        ),
      );
    }, delay);
  }

  async reconnectActiveSessions(): Promise<void> {
    const activeSessions = await this.prisma.session.findMany({
      where: {
        status: {
          in: ACTIVE_SESSION_STATUSES,
        },
      },
    });

    this.logger.log(
      `Reconectando ${activeSessions.length} sessão(ões) ativa(s)`,
    );

    for (const session of activeSessions) {
      try {
        await this.createSocket(session.id);
      } catch (err) {
        this.logger.error(
          `[${session.id}] Falha ao reconectar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        );
      }
    }
  }

  private async handleQRCode(sessionId: string, qr: string): Promise<void> {
    const sessionSocket = this.sessions.get(sessionId);
    if (sessionSocket) {
      sessionSocket.qrCode = qr;
    }
    const sid = this.formatSessionId(sessionId);
    this.logger.log(`[${sid}] QR gerado`);
    qrcode.generate(qr, { small: true });
    await this.updateSessionStatus(sessionId, {
      qrCode: qr,
      status: 'connecting',
    });
  }

  private async handleConnectionOpen(
    sessionId: string,
    socket: WASocket,
  ): Promise<void> {
    const sessionSocket = this.sessions.get(sessionId);
    if (sessionSocket) {
      sessionSocket.logoutAttempts = 0;
      sessionSocket.isNewLogin = false;
    }

    const phoneNumber = this.extractPhoneNumber(socket);
    const sid = this.formatSessionId(sessionId);
    this.logger.log(
      `[${sid}] ✓ Conectado${phoneNumber ? ` | Tel: +${phoneNumber}` : ''}`,
    );

    await this.updateSessionStatus(sessionId, {
      status: 'connected',
      qrCode: null,
      phoneNumber,
    });
  }

  private async handleConnectionClose(
    sessionId: string,
    statusCode: number,
  ): Promise<void> {
    const isLoggedOut = statusCode === DisconnectReason.loggedOut;
    const isRestartRequired = statusCode === DisconnectReason.restartRequired;

    const sessionSocket = this.sessions.get(sessionId);
    const currentLogoutAttempts = (sessionSocket?.logoutAttempts ?? 0) + 1;
    const shouldReconnect = this.shouldReconnectSession(
      statusCode,
      currentLogoutAttempts,
      sessionSocket?.isNewLogin ?? false,
    );

    const sid = this.formatSessionId(sessionId);
    this.logger.log(
      `[${sid}] ✗ Desconectado | Code: ${statusCode} | Retry: ${shouldReconnect ? `✓ (${currentLogoutAttempts})` : '✗'}`,
    );

    this.sessions.delete(sessionId);

    if (
      isLoggedOut &&
      !sessionSocket?.isNewLogin &&
      currentLogoutAttempts >= MAX_LOGOUT_ATTEMPTS
    ) {
      this.logger.warn(
        `[${sid}] Sessão invalidada (${currentLogoutAttempts} tentativas) | Limpando credenciais`,
      );
      await this.clearSessionCredentials(sessionId);
      await this.updateSessionStatus(sessionId, { status: 'disconnected' });
    } else if (isLoggedOut || isRestartRequired) {
      await this.updateSessionStatus(sessionId, { status: 'connecting' });
    } else {
      await this.updateSessionStatus(sessionId, { status: 'disconnected' });
    }

    if (shouldReconnect) {
      const delay = this.getReconnectDelay(statusCode);
      this.scheduleReconnect(sessionId, delay);
    }
  }

  private handleCredsUpdate(
    sessionId: string,
    saveCreds: () => Promise<void>,
  ): void {
    saveCreds().catch((err) => {
      const sid = this.formatSessionId(sessionId);
      this.logger.error(
        `[${sid}] Falha ao salvar credenciais: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
      );
    });
  }

  private getConnectionUpdateHandler(
    sessionId: string,
    socket: WASocket,
    saveCreds: () => Promise<void>,
    currentQRRef: { value?: string },
  ) {
    return async (update: any) => {
      const {
        connection,
        lastDisconnect,
        qr,
        isNewLogin: isNewLoginFromSocket,
      } = update;

      if (qr) {
        currentQRRef.value = qr;
        await this.handleQRCode(sessionId, qr);
      }

      if (connection === 'open') {
        await this.handleConnectionOpen(sessionId, socket);
      } else if (connection === 'connecting') {
        await this.updateSessionStatus(sessionId, { status: 'connecting' });
      } else if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        await this.handleConnectionClose(sessionId, statusCode);
      }
    };
  }

  private registerMainEventListeners(
    sessionId: string,
    socket: WASocket,
  ): void {
    const sid = this.formatSessionId(sessionId);

    socket.ev.on('messaging-history.set' as any, async (payload: any) => {
      this.logger.log(`[${sid}] 📨 messaging-history.set`, {
        event: 'messaging-history.set',
        chatsCount: payload.chats?.length || 0,
        contactsCount: payload.contacts?.length || 0,
        messagesCount: payload.messages?.length || 0,
        isLatest: payload.isLatest,
        progress: payload.progress,
      });

      try {
        let settings;
        try {
          settings = await this.settingsService.getSettings(sessionId);
        } catch (error) {
          settings = {};
        }

        const shouldSync = settings?.syncFullHistory !== false;

        if (shouldSync) {
          await this.historySyncService.processHistorySync(sessionId, payload);
        } else {
          this.logger.debug(
            `[${sid}] Sincronização de histórico desabilitada (syncFullHistory: false)`,
          );
        }
      } catch (error) {
        this.logger.error(
          `[${sid}] Erro ao processar messaging-history.set: ${error.message}`,
        );
      }
    });

    socket.ev.on('messages.upsert' as any, async (payload: any) => {
      this.logger.log(`[${sid}] 📨 messages.upsert`, { event: 'messages.upsert', payload });
      
      try {
        const { messages, type } = payload;
        
        for (const msg of messages) {
          if (!msg.key || !msg.key.id || !msg.key.remoteJid) continue;

          const parsedContent = parseMessageContent(msg);

          await this.persistenceService.createMessage(sessionId, {
            remoteJid: msg.key.remoteJid,
            messageId: msg.key.id,
            fromMe: msg.key.fromMe || false,
            senderJid: msg.key.participant || msg.key.remoteJid,
            senderName: msg.pushName,
            timestamp: msg.messageTimestamp || Date.now(),
            messageType: parsedContent.messageType,
            textContent: parsedContent.textContent,
            mediaUrl: parsedContent.mediaUrl,
            metadata: parsedContent.metadata,
          });

          if (msg.pushName && msg.key.remoteJid) {
            await this.persistenceService.createOrUpdateContact(sessionId, {
              remoteJid: msg.key.remoteJid,
              name: msg.pushName,
            });
          }
        }
      } catch (error) {
        this.logger.error(`[${sid}] Erro ao persistir messages.upsert: ${error.message}`);
      }
    });

    socket.ev.on('messages.update' as any, async (payload: any) => {
      this.logger.log(`[${sid}] 📨 messages.update`, { event: 'messages.update', payload });
      
      try {
        for (const update of payload) {
          if (!update.key || !update.key.id) continue;

          let status: MessageStatus | undefined;
          
          if (update.update?.status !== undefined) {
            const statusMap: Record<number, MessageStatus> = {
              0: MessageStatus.pending,
              1: MessageStatus.sent,
              2: MessageStatus.delivered,
              3: MessageStatus.read,
              4: MessageStatus.failed,
            };
            status = statusMap[update.update.status];
          }

          if (status) {
            await this.persistenceService.updateMessageStatus(
              sessionId,
              update.key.id,
              status,
            );
          }
        }
      } catch (error) {
        this.logger.error(`[${sid}] Erro ao persistir messages.update: ${error.message}`);
      }
    });

    socket.ev.on('messages.delete' as any, async (payload: any) => {
      this.logger.log(`[${sid}] 📨 messages.delete`, { event: 'messages.delete', payload });
      
      try {
        const { keys } = payload;
        for (const key of keys) {
          if (key.id) {
            await this.persistenceService.markMessageAsDeleted(sessionId, key.id);
          }
        }
      } catch (error) {
        this.logger.error(`[${sid}] Erro ao persistir messages.delete: ${error.message}`);
      }
    });

    socket.ev.on('message-receipt.update' as any, async (payload: any) => {
      this.logger.log(`[${sid}] 📨 message-receipt.update`, { event: 'message-receipt.update', payload });
      
      try {
        for (const receipt of payload) {
          if (!receipt.key || !receipt.key.id) continue;

          let status: MessageStatus | undefined;
          
          if (receipt.receipt?.receiptTimestamp) {
            status = receipt.receipt.readTimestamp 
              ? MessageStatus.read 
              : MessageStatus.delivered;
          }

          if (status) {
            await this.persistenceService.updateMessageStatus(
              sessionId,
              receipt.key.id,
              status,
            );
          }
        }
      } catch (error) {
        this.logger.error(`[${sid}] Erro ao persistir message-receipt.update: ${error.message}`);
      }
    });

    socket.ev.on('chats.upsert' as any, async (payload: any) => {
      this.logger.log(`[${sid}] 📨 chats.upsert`, { event: 'chats.upsert', payload });
      
      try {
        for (const chat of payload) {
          await this.persistenceService.createOrUpdateChat(sessionId, {
            remoteJid: chat.id,
            name: chat.name,
            unreadCount: chat.unreadCount,
            lastMessageTimestamp: chat.conversationTimestamp,
            archived: chat.archived,
            pinned: chat.pinned,
            muted: chat.mute?.endTimestamp ? true : false,
          });
        }
      } catch (error) {
        this.logger.error(`[${sid}] Erro ao persistir chats.upsert: ${error.message}`);
      }
    });

    socket.ev.on('chats.update' as any, async (payload: any) => {
      this.logger.log(`[${sid}] 📨 chats.update`, { event: 'chats.update', payload });
      
      try {
        for (const chat of payload) {
          const updateData: any = { remoteJid: chat.id };
          
          if (chat.name !== undefined) updateData.name = chat.name;
          if (chat.unreadCount !== undefined) updateData.unreadCount = chat.unreadCount;
          if (chat.conversationTimestamp !== undefined) {
            updateData.lastMessageTimestamp = chat.conversationTimestamp;
          }
          if (chat.archived !== undefined) updateData.archived = chat.archived;
          if (chat.pinned !== undefined) updateData.pinned = chat.pinned;
          if (chat.mute !== undefined) {
            updateData.muted = chat.mute?.endTimestamp ? true : false;
          }

          await this.persistenceService.createOrUpdateChat(sessionId, updateData);
        }
      } catch (error) {
        this.logger.error(`[${sid}] Erro ao persistir chats.update: ${error.message}`);
      }
    });

    socket.ev.on('contacts.upsert' as any, async (payload: any) => {
      this.logger.log(`[${sid}] 📨 contacts.upsert`, { event: 'contacts.upsert', payload });
      
      try {
        for (const contact of payload) {
          await this.persistenceService.createOrUpdateContact(sessionId, {
            remoteJid: contact.id,
            name: contact.notify || contact.name,
            profilePicUrl: contact.imgUrl,
          });
        }
      } catch (error) {
        this.logger.error(`[${sid}] Erro ao persistir contacts.upsert: ${error.message}`);
      }
    });

    socket.ev.on('contacts.update' as any, async (payload: any) => {
      this.logger.log(`[${sid}] 📨 contacts.update`, { event: 'contacts.update', payload });
      
      try {
        for (const contact of payload) {
          await this.persistenceService.createOrUpdateContact(sessionId, {
            remoteJid: contact.id,
            name: contact.notify || contact.name,
            profilePicUrl: contact.imgUrl,
          });
        }
      } catch (error) {
        this.logger.error(`[${sid}] Erro ao persistir contacts.update: ${error.message}`);
      }
    });

    const otherEvents = [
      'presence.update',
      'chats.delete',
      'groups.upsert',
      'groups.update',
      'call',
    ];

    otherEvents.forEach((event) => {
      socket.ev.on(event as any, (payload: any) => {
        this.logger.log(`[${sid}] 📨 ${event}`, { event, payload });
      });
    });
  }

  private async registerWebhookListeners(
    sessionId: string,
    socket: WASocket,
  ): Promise<void> {
    try {
      const webhook = await this.webhooksService.findBySessionId(sessionId);
      const sid = this.formatSessionId(sessionId);

      if (!webhook || !webhook.enabled || webhook.events.length === 0) {
        return;
      }

      webhook.events.forEach((event) => {
        socket.ev.on(event as any, async (payload: any) => {
          await this.webhooksService.trigger(sessionId, event, payload);
        });
      });

      this.logger.log(
        `[${sid}] Webhooks registrados: ${webhook.events.length} evento(s)`,
      );
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao registrar webhooks: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  async createSocket(
    sessionId: string,
  ): Promise<{ socket: WASocket; qr?: string }> {
    const hasExistingCreds = await this.prisma.authState.findFirst({
      where: { sessionId, keyType: 'creds' },
    });
    const isNewLogin = !hasExistingCreds;

    const sid = this.formatSessionId(sessionId);
    this.logger.log(
      `[${sid}] Criando socket${isNewLogin ? ' | Novo login' : ' | Reconexão'}`,
    );

    const { state, saveCreds } = await useAuthState(sessionId, this.prisma);
    const currentQRRef = { value: undefined as string | undefined };

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: this.createSilentLogger() as any,
    });

    socket.ev.on(
      'connection.update',
      this.getConnectionUpdateHandler(sessionId, socket, saveCreds, currentQRRef),
    );

    socket.ev.on('creds.update', () => {
      this.handleCredsUpdate(sessionId, saveCreds);
    });

    this.registerMainEventListeners(sessionId, socket);

    await this.registerWebhookListeners(sessionId, socket);

    this.sessions.set(sessionId, {
      socket,
      qrCode: currentQRRef.value,
      isNewLogin,
      logoutAttempts: 0,
    });

    return { socket, qr: currentQRRef.value };
  }

  getSocket(sessionId: string): WASocket | undefined {
    return this.sessions.get(sessionId)?.socket;
  }

  getQRCode(sessionId: string): string | undefined {
    return this.sessions.get(sessionId)?.qrCode;
  }

  async disconnectSocket(sessionId: string): Promise<void> {
    const sessionSocket = this.sessions.get(sessionId);
    if (sessionSocket) {
      await sessionSocket.socket.logout();
      this.sessions.delete(sessionId);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.disconnectSocket(sessionId);
  }
}
