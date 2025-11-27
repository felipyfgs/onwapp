import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnApplicationBootstrap,
  Inject,
  forwardRef,
} from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  WASocket,
  ConnectionState,
  SocketConfig,
} from 'whaileys';
import { Boom } from '@hapi/boom';
import { PrismaService } from '../../database/prisma.service';
import { SessionStatus } from '@prisma/client';
import { useDbAuthState } from './auth-state.service';
import * as qrcodeTerminal from 'qrcode-terminal';
import { LoggerService } from '../../logger/logger.service';
import { WebhookService } from '../../integrations/webhook/webhook.service';

export interface SessionInstance {
  socket: WASocket;
  status: SessionStatus;
  qrcode?: string;
  dbSessionId?: string;
}

@Injectable()
export class WhaileysService
  implements OnModuleDestroy, OnApplicationBootstrap
{
  private readonly logger = new Logger(WhaileysService.name);
  private sessions: Map<string, SessionInstance> = new Map();

  constructor(
    private prisma: PrismaService,
    private loggerService: LoggerService,
    @Inject(forwardRef(() => WebhookService))
    private webhookService: WebhookService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Restoring WhatsApp sessions...');
    await this.restoreSessions();
  }

  onModuleDestroy() {
    for (const [name, session] of this.sessions) {
      this.logger.log(`Closing session: ${name}`);
      session.socket.end(undefined);
    }
  }

  async createSession(name: string) {
    const existing = await this.prisma.session.findUnique({ where: { name } });
    if (existing) {
      return existing;
    }

    const session = await this.prisma.session.create({
      data: { name, status: SessionStatus.disconnected },
    });

    this.logger.log(`Session ${name} created`);
    return session;
  }

  getSession(name: string): SessionInstance | null {
    return this.sessions.get(name) || null;
  }

  async getAllSessions() {
    return this.prisma.session.findMany();
  }

  async deleteSession(name: string): Promise<void> {
    const session = this.sessions.get(name);
    if (session) {
      void session.socket.logout();
      this.sessions.delete(name);
    }

    await this.prisma.session.delete({ where: { name } }).catch(() => {});

    this.logger.log(`Session ${name} deleted`);
  }

  async sendMessage(sessionName: string, to: string, message: string) {
    const session = this.sessions.get(sessionName);
    if (!session || session.status !== SessionStatus.connected) {
      throw new Error(`Session ${sessionName} not connected`);
    }

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    const result = await session.socket.sendMessage(jid, { text: message });
    this.logger.log(`Message sent from ${sessionName} to ${to}`);
    return result;
  }

  async restoreSessions(): Promise<void> {
    const sessions = await this.prisma.session.findMany({
      where: { status: { not: SessionStatus.disconnected } },
    });

    for (const session of sessions) {
      this.logger.log(`Restoring session: ${session.name}`);
      await this.connectSession(session.name);
    }
  }

  async connectSession(
    name: string,
  ): Promise<{ qrcode?: string; status: SessionStatus }> {
    const existingSession = this.sessions.get(name);
    if (existingSession && existingSession.status === SessionStatus.connected) {
      return { status: SessionStatus.connected };
    }

    if (existingSession) {
      existingSession.socket.end(undefined);
      this.sessions.delete(name);
    }

    const dbSession = await this.prisma.session.findUnique({ where: { name } });
    if (!dbSession) {
      throw new Error(`Session ${name} not found. Create it first.`);
    }

    return this.startConnection(name);
  }

  private async startConnection(
    name: string,
  ): Promise<{ qrcode?: string; status: SessionStatus }> {
    const dbSession = await this.prisma.session.findUnique({ where: { name } });
    if (!dbSession) {
      throw new Error(`Session ${name} not found`);
    }

    const { state, saveCreds } = await useDbAuthState(
      this.prisma,
      dbSession.id,
    );

    const baileysLogger = this.loggerService.child({ class: 'baileys' });

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: baileysLogger as unknown as SocketConfig['logger'],
    });

    const sessionInstance: SessionInstance = {
      socket,
      status: SessionStatus.connecting,
      dbSessionId: dbSession.id,
    };

    this.sessions.set(name, sessionInstance);

    await this.prisma.session.update({
      where: { name },
      data: { status: SessionStatus.connecting },
    });

    socket.ev.on('creds.update', () => {
      void saveCreds();
    });

    socket.ev.on('connection.update', (update: Partial<ConnectionState>) => {
      void this.handleConnectionUpdate(name, sessionInstance, socket, update);
    });

    this.registerEventListeners(name, socket);

    return { status: SessionStatus.connecting };
  }

  private registerEventListeners(name: string, socket: WASocket) {
    const pinoLogger = this.loggerService.child({ session: name });
    const sessionInstance = this.sessions.get(name);
    const sessionId = sessionInstance?.dbSessionId;

    const dispatchWebhook = (event: string, data: unknown) => {
      if (sessionId) {
        void this.webhookService.dispatch(sessionId, event, data);
      }
    };

    socket.ev.on('messages.upsert', (payload) => {
      pinoLogger.info(
        { event: 'messages.upsert', payload },
        `messages.upsert (${payload.type}): ${payload.messages.length} messages`,
      );
      dispatchWebhook('messages.upsert', payload);
    });

    socket.ev.on('messages.update', (payload) => {
      pinoLogger.info(
        { event: 'messages.update', payload },
        `messages.update: ${payload.length} updates`,
      );
      dispatchWebhook('messages.update', payload);
    });

    socket.ev.on('messages.reaction', (payload) => {
      pinoLogger.info(
        { event: 'messages.reaction', payload },
        `messages.reaction: ${payload.length} reactions`,
      );
      dispatchWebhook('messages.reaction', payload);
    });

    socket.ev.on('message-receipt.update', (payload) => {
      pinoLogger.info(
        { event: 'message-receipt.update', payload },
        `message-receipt.update: ${payload.length} receipts`,
      );
      dispatchWebhook('message-receipt.update', payload);
    });

    socket.ev.on('chats.upsert', (payload) => {
      pinoLogger.info(
        { event: 'chats.upsert', payload },
        `chats.upsert: ${payload.length} chats`,
      );
      dispatchWebhook('chats.upsert', payload);
    });

    socket.ev.on('chats.update', (payload) => {
      pinoLogger.info(
        { event: 'chats.update', payload },
        `chats.update: ${payload.length} chats`,
      );
      dispatchWebhook('chats.update', payload);
    });

    socket.ev.on('chats.delete', (payload) => {
      pinoLogger.info(
        { event: 'chats.delete', payload },
        `chats.delete: ${payload.length} chats`,
      );
      dispatchWebhook('chats.delete', payload);
    });

    socket.ev.on('contacts.upsert', (payload) => {
      pinoLogger.info(
        { event: 'contacts.upsert', payload },
        `contacts.upsert: ${payload.length} contacts`,
      );
      dispatchWebhook('contacts.upsert', payload);
    });

    socket.ev.on('contacts.update', (payload) => {
      pinoLogger.info(
        { event: 'contacts.update', payload },
        `contacts.update: ${payload.length} contacts`,
      );
      dispatchWebhook('contacts.update', payload);
    });

    socket.ev.on('groups.upsert', (payload) => {
      pinoLogger.info(
        { event: 'groups.upsert', payload },
        `groups.upsert: ${payload.length} groups`,
      );
      dispatchWebhook('groups.upsert', payload);
    });

    socket.ev.on('groups.update', (payload) => {
      pinoLogger.info(
        { event: 'groups.update', payload },
        `groups.update: ${payload.length} groups`,
      );
      dispatchWebhook('groups.update', payload);
    });

    socket.ev.on('group-participants.update', (payload) => {
      pinoLogger.info(
        { event: 'group-participants.update', payload },
        `group-participants.update: ${payload.action} ${payload.participants.length} in ${payload.id}`,
      );
      dispatchWebhook('group-participants.update', payload);
    });

    socket.ev.on('presence.update', (payload) => {
      const entries = Object.entries(payload.presences);
      pinoLogger.info(
        { event: 'presence.update', payload },
        `presence.update: ${entries.length} presences in ${payload.id}`,
      );
      dispatchWebhook('presence.update', payload);
    });

    socket.ev.on('messaging-history.set', (payload) => {
      pinoLogger.info(
        { event: 'messaging-history.set', payload },
        `messaging-history.set: ${payload.chats.length} chats, ${payload.contacts.length} contacts, ${payload.messages.length} messages (latest: ${payload.isLatest})`,
      );
    });

    socket.ev.on('blocklist.set', (payload) => {
      pinoLogger.info(
        { event: 'blocklist.set', payload },
        `blocklist.set: ${payload.blocklist.length} blocked`,
      );
    });

    socket.ev.on('blocklist.update', (payload) => {
      pinoLogger.info(
        { event: 'blocklist.update', payload },
        `blocklist.update (${payload.type}): ${payload.blocklist.length}`,
      );
    });

    socket.ev.on('call', (payload) => {
      pinoLogger.info(
        { event: 'call', payload },
        `call: ${payload.length} calls`,
      );
      dispatchWebhook('call', payload);
    });
  }

  private async handleConnectionUpdate(
    name: string,
    sessionInstance: SessionInstance,
    socket: WASocket,
    update: Partial<ConnectionState>,
  ) {
    const { connection, lastDisconnect, qr } = update;

    if (sessionInstance.dbSessionId) {
      void this.webhookService.dispatch(
        sessionInstance.dbSessionId,
        'connection.update',
        {
          connection,
          qr: qr ? true : undefined,
        },
      );
    }

    if (qr) {
      sessionInstance.qrcode = qr;
      await this.prisma.session.update({
        where: { name },
        data: { qrcode: qr },
      });
      this.logger.log(`QR code generated for session: ${name}`);

      (
        qrcodeTerminal as {
          generate: (qr: string, opts: { small: boolean }) => void;
        }
      ).generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect =
        statusCode !== (DisconnectReason.loggedOut as number);

      sessionInstance.status = SessionStatus.disconnected;
      await this.prisma.session.update({
        where: { name },
        data: { status: SessionStatus.disconnected, qrcode: null },
      });

      this.logger.warn(
        `Session ${name} disconnected. Reconnect: ${shouldReconnect}`,
      );

      if (shouldReconnect) {
        this.sessions.delete(name);
        setTimeout(() => {
          void this.startConnection(name);
        }, 3000);
      } else {
        this.sessions.delete(name);
      }
    }

    if (connection === 'open') {
      const phone = socket.user?.id?.split(':')[0] || null;
      sessionInstance.status = SessionStatus.connected;
      sessionInstance.qrcode = undefined;

      await this.prisma.session.update({
        where: { name },
        data: { status: SessionStatus.connected, qrcode: null, phone },
      });

      this.logger.log(`Session ${name} connected. Phone: ${phone}`);
    }
  }

  async getQr(name: string): Promise<string | null> {
    const session = this.sessions.get(name);
    if (session?.qrcode) {
      return session.qrcode;
    }

    const dbSession = await this.prisma.session.findUnique({ where: { name } });
    return dbSession?.qrcode || null;
  }

  async getStatus(
    name: string,
  ): Promise<{ status: SessionStatus; phone?: string }> {
    const session = this.sessions.get(name);
    if (session) {
      const dbSession = await this.prisma.session.findUnique({
        where: { name },
      });
      return {
        status: session.status,
        phone: dbSession?.phone || undefined,
      };
    }

    const dbSession = await this.prisma.session.findUnique({ where: { name } });
    if (!dbSession) {
      throw new Error(`Session ${name} not found`);
    }

    return {
      status: dbSession.status,
      phone: dbSession.phone || undefined,
    };
  }

  async logoutSession(name: string): Promise<void> {
    const session = this.sessions.get(name);
    if (session) {
      await session.socket.logout();
      session.socket.end(undefined);
      this.sessions.delete(name);
    }

    const dbSession = await this.prisma.session.findUnique({ where: { name } });
    if (dbSession) {
      await this.prisma.authState.deleteMany({
        where: { sessionId: dbSession.id },
      });
    }

    await this.prisma.session.update({
      where: { name },
      data: { status: SessionStatus.disconnected, qrcode: null, phone: null },
    });

    this.logger.log(`Session ${name} logged out`);
  }

  async restartSession(
    name: string,
  ): Promise<{ qrcode?: string; status: SessionStatus }> {
    const session = this.sessions.get(name);
    if (session) {
      session.socket.end(undefined);
      this.sessions.delete(name);
    }

    const dbSession = await this.prisma.session.findUnique({ where: { name } });
    if (dbSession) {
      await this.prisma.authState.deleteMany({
        where: { sessionId: dbSession.id },
      });
    }

    await this.prisma.session.update({
      where: { name },
      data: { status: SessionStatus.disconnected, qrcode: null, phone: null },
    });

    this.logger.log(`Session ${name} restarting...`);
    return this.startConnection(name);
  }

  async getSessionInfo(name: string): Promise<{
    name: string;
    status: SessionStatus;
    phone?: string;
    user?: unknown;
  }> {
    const session = this.sessions.get(name);
    const dbSession = await this.prisma.session.findUnique({ where: { name } });

    if (!dbSession) {
      throw new Error(`Session ${name} not found`);
    }

    return {
      name: dbSession.name,
      status: session?.status || dbSession.status,
      phone: dbSession.phone || undefined,
      user: session?.socket.user || undefined,
    };
  }

  getConnectedSocket(sessionName: string): WASocket {
    const session = this.sessions.get(sessionName);
    if (!session || session.status !== SessionStatus.connected) {
      throw new Error(`Session ${sessionName} not connected`);
    }
    return session.socket;
  }

  // Chat operations
  async archiveChat(sessionName: string, jid: string, archive: boolean) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.chatModify({ archive, lastMessages: [] }, jid);
  }

  async muteChat(sessionName: string, jid: string, mute: number | null) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.chatModify({ mute }, jid);
  }

  async pinChat(sessionName: string, jid: string, pin: boolean) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.chatModify({ pin }, jid);
  }

  async markChatRead(sessionName: string, jid: string, read: boolean) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.chatModify({ markRead: read, lastMessages: [] }, jid);
  }

  async deleteChat(sessionName: string, jid: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.chatModify({ delete: true, lastMessages: [] }, jid);
  }

  // Contact operations
  async blockContact(sessionName: string, jid: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.updateBlockStatus(jid, 'block');
  }

  async unblockContact(sessionName: string, jid: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.updateBlockStatus(jid, 'unblock');
  }

  async checkNumberExists(sessionName: string, phone: string) {
    const socket = this.getConnectedSocket(sessionName);
    const [result] = await socket.onWhatsApp(phone);
    return result;
  }

  async getProfilePicture(sessionName: string, jid: string) {
    const socket = this.getConnectedSocket(sessionName);
    try {
      return await socket.profilePictureUrl(jid, 'image');
    } catch {
      return null;
    }
  }

  async getContactStatus(sessionName: string, jid: string) {
    const socket = this.getConnectedSocket(sessionName);
    return socket.fetchStatus(jid);
  }

  async getBusinessProfile(sessionName: string, jid: string) {
    const socket = this.getConnectedSocket(sessionName);
    return socket.getBusinessProfile(jid);
  }

  // Profile operations
  async updateProfileStatus(sessionName: string, status: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.updateProfileStatus(status);
  }

  async updateProfileName(sessionName: string, name: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.updateProfileName(name);
  }

  async updateProfilePicture(sessionName: string, imageUrl: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.updateProfilePicture(socket.user?.id || '', { url: imageUrl });
  }

  async sendPresenceUpdate(
    sessionName: string,
    presence:
      | 'available'
      | 'unavailable'
      | 'composing'
      | 'recording'
      | 'paused',
    jid?: string,
  ) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.sendPresenceUpdate(presence, jid);
  }

  async presenceSubscribe(sessionName: string, jid: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.presenceSubscribe(jid);
  }

  async setDisappearingMessages(
    sessionName: string,
    jid: string,
    expiration: number | boolean,
  ) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.sendMessage(jid, {
      disappearingMessagesInChat: expiration,
    });
  }

  async starMessage(
    sessionName: string,
    jid: string,
    messageId: string,
    star: boolean,
  ) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.chatModify(
      {
        star: {
          messages: [{ id: messageId, fromMe: true }],
          star,
        },
      },
      jid,
    );
  }

  async updateGroupPicture(
    sessionName: string,
    groupJid: string,
    imageUrl: string,
  ) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.updateProfilePicture(groupJid, { url: imageUrl });
  }

  async getBroadcastListInfo(sessionName: string, broadcastId: string) {
    const socket = this.getConnectedSocket(sessionName);
    const metadata = await socket.groupMetadata(broadcastId);
    return {
      id: metadata.id,
      name: metadata.subject,
      recipients: metadata.participants?.map((p) => p.id) || [],
    };
  }

  async groupAcceptInviteV4(
    sessionName: string,
    senderId: string,
    inviteMessage: {
      groupJid: string;
      inviteCode: string;
      inviteExpiration: number;
      groupName?: string;
    },
  ): Promise<string | undefined> {
    const socket = this.getConnectedSocket(sessionName);
    return socket.groupAcceptInviteV4(senderId, inviteMessage) as Promise<
      string | undefined
    >;
  }
}
