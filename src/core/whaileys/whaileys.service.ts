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
  ProductCreate,
  ProductUpdate,
  WAMessageKey,
  proto,
  jidNormalizedUser,
  AnyMessageContent,
} from 'whaileys';
import { Boom } from '@hapi/boom';
import { PrismaService } from '../../database/prisma.service';
import { SessionStatus } from '@prisma/client';
import { useDbAuthState } from './auth-state.service';
import * as qrcodeTerminal from 'qrcode-terminal';
import { LoggerService } from '../../logger/logger.service';
import { WebhookService } from '../../integrations/webhook/webhook.service';
import {
  BehaviorSettings,
  SessionInstance,
  CarouselCard,
  NativeFlowButton,
  ButtonConfig,
  ListSection,
} from './types';

export type { BehaviorSettings, SessionInstance } from './types';

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
    const results = await socket.onWhatsApp(phone);
    return results?.[0];
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

  // Privacy operations
  async fetchPrivacySettings(sessionName: string) {
    const socket = this.getConnectedSocket(sessionName);
    return socket.fetchPrivacySettings(true);
  }

  async updateLastSeenPrivacy(sessionName: string, value: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.updateLastSeenPrivacy(
      value as 'all' | 'contacts' | 'contact_blacklist' | 'none',
    );
  }

  async updateOnlinePrivacy(sessionName: string, value: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.updateOnlinePrivacy(value as 'all' | 'match_last_seen');
  }

  async updateProfilePicturePrivacy(sessionName: string, value: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.updateProfilePicturePrivacy(
      value as 'all' | 'contacts' | 'contact_blacklist' | 'none',
    );
  }

  async updateStatusPrivacy(sessionName: string, value: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.updateStatusPrivacy(
      value as 'all' | 'contacts' | 'contact_blacklist' | 'none',
    );
  }

  async updateReadReceiptsPrivacy(sessionName: string, value: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.updateReadReceiptsPrivacy(value as 'all' | 'none');
  }

  async updateGroupsAddPrivacy(sessionName: string, value: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.updateGroupsAddPrivacy(
      value as 'all' | 'contacts' | 'contact_blacklist',
    );
  }

  // Note: updateCallPrivacy and updateMessagesPrivacy not available in @fadzzzslebew/baileys
  async updateCallPrivacy(_sessionName: string, _value: string) {
    throw new Error('updateCallPrivacy not available in @fadzzzslebew/baileys');
  }

  async updateMessagesPrivacy(_sessionName: string, _value: string) {
    throw new Error('updateMessagesPrivacy not available in @fadzzzslebew/baileys');
  }

  // Contact management
  async fetchBlocklist(sessionName: string): Promise<string[]> {
    const socket = this.getConnectedSocket(sessionName);
    const result = await socket.fetchBlocklist();
    return result.filter((jid): jid is string => jid !== undefined);
  }

  // Note: addOrEditContact and removeContact not available in @fadzzzslebew/baileys
  async addOrEditContact(
    _sessionName: string,
    _jid: string,
    _contact: { fullName?: string; firstName?: string },
  ) {
    throw new Error('addOrEditContact not available in @fadzzzslebew/baileys');
  }

  async removeContact(_sessionName: string, _jid: string) {
    throw new Error('removeContact not available in @fadzzzslebew/baileys');
  }

  // Profile additional operations
  async getMyProfilePicture(sessionName: string): Promise<string | null> {
    const socket = this.getConnectedSocket(sessionName);
    try {
      const url = await socket.profilePictureUrl(
        socket.user?.id || '',
        'image',
      );
      return url ?? null;
    } catch {
      return null;
    }
  }

  async removeProfilePicture(sessionName: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.updateProfilePicture(
      socket.user?.id || '',
      null as unknown as { url: string },
    );
  }

  async getMyStatus(
    sessionName: string,
  ): Promise<{ status?: string; setAt?: Date }> {
    const socket = this.getConnectedSocket(sessionName);
    const result = await socket.fetchStatus(socket.user?.id || '');
    const firstResult = Array.isArray(result) ? result[0] : result;
    return {
      status: firstResult?.status as string | undefined,
      setAt: firstResult?.setAt as Date | undefined,
    };
  }

  // Chat additional operations
  async clearChatMessages(sessionName: string, jid: string) {
    const socket = this.getConnectedSocket(sessionName);
    await socket.chatModify({ clear: true, lastMessages: [] } as unknown as Parameters<typeof socket.chatModify>[0], jid);
  }

  // Behavior settings
  getBehaviorSettings(sessionName: string): BehaviorSettings {
    const session = this.sessions.get(sessionName);
    if (!session) {
      throw new Error(`Session ${sessionName} not found`);
    }
    return session.behavior || {};
  }

  updateBehaviorSettings(
    sessionName: string,
    settings: Partial<BehaviorSettings>,
  ): void {
    const session = this.sessions.get(sessionName);
    if (!session) {
      throw new Error(`Session ${sessionName} not found`);
    }

    session.behavior = {
      ...session.behavior,
      ...settings,
    };

    if (settings.always_online !== undefined && settings.always_online) {
      this.sendPresenceUpdate(sessionName, 'available').catch(() => {});
    }
  }

  // Pairing code
  async requestPairingCode(
    sessionName: string,
    phoneNumber: string,
    customCode?: string,
  ): Promise<string> {
    const session = this.sessions.get(sessionName);
    if (!session) {
      throw new Error(`Session ${sessionName} not found`);
    }
    if (!session.socket) {
      throw new Error(`Session ${sessionName} not initialized`);
    }
    return session.socket.requestPairingCode(phoneNumber);
  }

  // Calls
  async rejectCall(
    sessionName: string,
    callId: string,
    callFrom: string,
  ): Promise<void> {
    const socket = this.getConnectedSocket(sessionName);
    await socket.rejectCall(callId, callFrom);
  }

  // Business
  async getCatalog(sessionName: string, jid?: string, _limit?: number) {
    const socket = this.getConnectedSocket(sessionName);
    return socket.getCatalog(jid);
  }

  async getCollections(sessionName: string, jid?: string, _limit?: number) {
    const socket = this.getConnectedSocket(sessionName);
    return socket.getCollections(jid);
  }

  async getOrderDetails(
    sessionName: string,
    orderId: string,
    tokenBase64: string,
  ) {
    const socket = this.getConnectedSocket(sessionName);
    return socket.getOrderDetails(orderId, tokenBase64);
  }

  async productCreate(sessionName: string, create: ProductCreate) {
    const socket = this.getConnectedSocket(sessionName);
    return socket.productCreate(create);
  }

  async productUpdate(
    sessionName: string,
    productId: string,
    update: ProductUpdate,
  ) {
    const socket = this.getConnectedSocket(sessionName);
    return socket.productUpdate(productId, update);
  }

  async productDelete(sessionName: string, productIds: string[]) {
    const socket = this.getConnectedSocket(sessionName);
    return socket.productDelete(productIds);
  }

  // Messages advanced
  async updateMediaMessage(
    sessionName: string,
    message: proto.IWebMessageInfo,
  ) {
    const socket = this.getConnectedSocket(sessionName);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return socket.updateMediaMessage(message as any);
  }

  // Note: fetchMessageHistory and requestPlaceholderResend not available in @fadzzzslebew/baileys
  async fetchMessageHistory(
    _sessionName: string,
    _count: number,
    _oldestMsgKey: WAMessageKey,
    _oldestMsgTimestamp: number,
  ) {
    throw new Error('fetchMessageHistory not available in @fadzzzslebew/baileys');
  }

  async requestPlaceholderResend(
    _sessionName: string,
    _messageKeys: { messageKey: WAMessageKey }[],
  ) {
    throw new Error('requestPlaceholderResend not available in @fadzzzslebew/baileys');
  }

  // Button messages (using @fadzzzslebew/baileys API)
  async sendButtonMessage(
    sessionName: string,
    to: string,
    content: {
      text: string;
      footer?: string;
      buttons: Array<{
        buttonId: string;
        buttonText: { displayText: string };
        type?: number;
      }>;
      headerType?: number;
      viewOnce?: boolean;
      image?: { url: string } | Buffer;
      video?: { url: string } | Buffer;
    },
  ) {
    const socket = this.getConnectedSocket(sessionName);
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

    // @fadzzzslebew/baileys uses direct button message format
    const buttonMessage = {
      text: content.text,
      footer: content.footer || '',
      buttons: content.buttons.map((b) => ({
        buttonId: b.buttonId,
        buttonText: { displayText: b.buttonText.displayText },
        type: b.type || 1,
      })),
      headerType: content.headerType || 1,
      viewOnce: content.viewOnce ?? true,
      ...(content.image && { image: content.image, caption: content.text }),
      ...(content.video && { video: content.video, caption: content.text }),
    };

    // Remove text if we have media (use caption instead)
    if (content.image || content.video) {
      delete (buttonMessage as Record<string, unknown>).text;
    }

    return socket.sendMessage(
      jid,
      buttonMessage as Parameters<typeof socket.sendMessage>[1],
    );
  }

  // Interactive messages (native flow - URL, Copy, Quick Reply buttons)
  async sendInteractiveMessage(
    sessionName: string,
    to: string,
    content: {
      text: string;
      title?: string;
      footer?: string;
      interactive: Array<{
        name: string;
        buttonParamsJson: string;
      }>;
      image?: { url: string } | Buffer;
      video?: { url: string } | Buffer;
    },
  ) {
    const socket = this.getConnectedSocket(sessionName);
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

    // @fadzzzslebew/baileys uses 'interactive' property for native flow buttons
    const interactiveMessage = {
      text: content.text,
      title: content.title || '',
      footer: content.footer || '',
      interactive: content.interactive,
      ...(content.image && {
        image: content.image,
        caption: content.text,
        hasMediaAttachment: true,
      }),
      ...(content.video && {
        video: content.video,
        caption: content.text,
        hasMediaAttachment: true,
      }),
    };

    if (content.image || content.video) {
      delete (interactiveMessage as Record<string, unknown>).text;
    }

    return socket.sendMessage(
      jid,
      interactiveMessage as Parameters<typeof socket.sendMessage>[1],
    );
  }

  /**
   * Send interactive message with template buttons (URL, Call, Quick Reply)
   * Uses whaileys format with templateButtons for HydratedFourRowTemplate
   */
  async sendInteractiveButtons(
    sessionName: string,
    to: string,
    text: string,
    footer: string,
    buttons: Array<{ name: string; buttonParamsJson: string }>,
    _imageUrl?: string,
  ) {
    const socket = this.getConnectedSocket(sessionName);
    const jid = this.formatJid(to);

    // Convert to templateButtons format (HydratedTemplateButton)
    const templateButtons: proto.IHydratedTemplateButton[] = [];

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const params = JSON.parse(btn.buttonParamsJson);

      if (btn.name === 'cta_url') {
        templateButtons.push({
          index: i + 1,
          urlButton: {
            displayText: params.display_text,
            url: params.url,
          },
        });
      } else if (btn.name === 'cta_call') {
        templateButtons.push({
          index: i + 1,
          callButton: {
            displayText: params.display_text,
            phoneNumber: params.phone_number,
          },
        });
      } else if (btn.name === 'quick_reply') {
        templateButtons.push({
          index: i + 1,
          quickReplyButton: {
            displayText: params.display_text,
            id: params.id,
          },
        });
      }
    }

    // Use whaileys sendMessage with templateButtons
    const content: AnyMessageContent = {
      text,
      footer,
      templateButtons,
    };

    return socket.sendMessage(jid, content);
  }

  /**
   * Send buttons message (simple buttons with buttonId)
   */
  async sendButtonsMessage(
    sessionName: string,
    to: string,
    text: string,
    footer: string,
    buttonsList: Array<{ buttonId: string; buttonText: { displayText: string } }>,
  ) {
    const socket = this.getConnectedSocket(sessionName);
    const jid = this.formatJid(to);

    const content: AnyMessageContent = {
      text,
      footer,
      buttons: buttonsList,
    };

    return socket.sendMessage(jid, content);
  }

  /**
   * Send list message with sections
   */
  async sendListMessage(
    sessionName: string,
    to: string,
    text: string,
    footer: string,
    title: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ title: string; rowId: string; description?: string }>;
    }>,
  ) {
    const socket = this.getConnectedSocket(sessionName);
    const jid = this.formatJid(to);

    const content: AnyMessageContent = {
      text,
      footer,
      title,
      buttonText,
      sections,
    };

    return socket.sendMessage(jid, content);
  }

  /**
   * Send carousel message with horizontal scrollable cards
   * Each card supports: image/video, title, body, footer, and action buttons
   */
  async sendCarouselMessage(
    sessionName: string,
    to: string,
    text: string,
    title: string,
    footer: string,
    cards: Array<{
      imageUrl?: string;
      videoUrl?: string;
      title: string;
      body: string;
      footer?: string;
      buttons: Array<{ name: string; buttonParamsJson: string }>;
    }>,
  ) {
    const socket = this.getConnectedSocket(sessionName);
    const jid = this.formatJid(to);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sock = socket as any;

    const carouselCards = await this.buildCarouselCards(cards, sock);

    const carouselMessage = {
      interactiveMessage: {
        body: { text },
        footer: { text: footer || '' },
        header: {
          title: title || '',
          subtitle: '',
          hasMediaAttachment: false,
        },
        carouselMessage: {
          cards: carouselCards,
          messageVersion: 1,
        },
      },
    };

    if (sock.relayMessage) {
      return sock.relayMessage(jid, carouselMessage, {});
    }

    return socket.sendMessage(
      jid,
      carouselMessage as unknown as Parameters<typeof socket.sendMessage>[1],
    );
  }

  /**
   * Build carousel cards with media upload support
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async buildCarouselCards(
    cards: Array<{
      imageUrl?: string;
      videoUrl?: string;
      title: string;
      body: string;
      footer?: string;
      buttons: Array<{ name: string; buttonParamsJson: string }>;
    }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sock: any,
  ): Promise<Array<Record<string, unknown>>> {
    return Promise.all(
      cards.map(async (card) => {
        const header: Record<string, unknown> = {
          title: card.title,
          subtitle: '',
          hasMediaAttachment: false,
        };

        if (card.imageUrl) {
          const imageMessage = await this.uploadCardMedia(
            sock,
            'image',
            card.imageUrl,
          );
          if (imageMessage) {
            header.imageMessage = imageMessage;
            header.hasMediaAttachment = true;
          }
        } else if (card.videoUrl) {
          const videoMessage = await this.uploadCardMedia(
            sock,
            'video',
            card.videoUrl,
          );
          if (videoMessage) {
            header.videoMessage = videoMessage;
            header.hasMediaAttachment = true;
          }
        }

        return {
          body: { text: card.body },
          footer: { text: card.footer || '' },
          header,
          nativeFlowMessage: {
            buttons: card.buttons,
            messageParamsJson: '',
          },
        };
      }),
    );
  }

  /**
   * Upload media for carousel card header
   */
  private async uploadCardMedia(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sock: any,
    type: 'image' | 'video',
    url: string,
  ): Promise<Record<string, unknown> | null> {
    if (!sock.waUploadToServer || !sock.rahmi?.utils?.prepareWAMessageMedia) {
      return null;
    }

    try {
      const media = await sock.rahmi.utils.prepareWAMessageMedia(
        { [type]: { url } },
        { upload: sock.waUploadToServer },
      );
      return media?.[`${type}Message`] || null;
    } catch {
      return null;
    }
  }

  /**
   * Format phone number to WhatsApp JID
   */
  private formatJid(to: string): string {
    return to.includes('@') ? to : `${to}@s.whatsapp.net`;
  }

  // List messages (using native flow single_select)
  async sendListMessage(
    sessionName: string,
    to: string,
    content: {
      text: string;
      footer?: string;
      title?: string;
      buttonText: string;
      sections: Array<{
        title: string;
        rows: Array<{
          title: string;
          rowId: string;
          description?: string;
        }>;
      }>;
    },
  ) {
    const socket = this.getConnectedSocket(sessionName);
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

    // @fadzzzslebew/baileys uses native flow for list messages
    const listMessage = {
      text: content.text,
      footer: content.footer || '',
      title: content.title || '',
      interactive: [
        {
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: content.buttonText,
            sections: content.sections.map((s) => ({
              title: s.title,
              rows: s.rows.map((r) => ({
                title: r.title,
                id: r.rowId,
                description: r.description || '',
              })),
            })),
          }),
        },
      ],
    };

    return socket.sendMessage(
      jid,
      listMessage as Parameters<typeof socket.sendMessage>[1],
    );
  }

  // Newsletter operations
  // Newsletter functions not available in whaileys 6.4.3
  async newsletterCreate(
    _sessionName: string,
    _name: string,
    _description?: string,
    _reactionCodes?: string,
  ) {
    throw new Error('Newsletter functions not available in whaileys 6.4.3');
  }

  async newsletterMetadata(
    _sessionName: string,
    _type: 'invite' | 'jid',
    _key: string,
  ) {
    throw new Error('Newsletter functions not available in whaileys 6.4.3');
  }

  async newsletterFollow(_sessionName: string, _jid: string) {
    throw new Error('Newsletter functions not available in whaileys 6.4.3');
  }

  async newsletterUnfollow(_sessionName: string, _jid: string) {
    throw new Error('Newsletter functions not available in whaileys 6.4.3');
  }

  async newsletterMute(_sessionName: string, _jid: string) {
    throw new Error('Newsletter functions not available in whaileys 6.4.3');
  }

  async newsletterUnmute(_sessionName: string, _jid: string) {
    throw new Error('Newsletter functions not available in whaileys 6.4.3');
  }

  async newsletterUpdateName(
    _sessionName: string,
    _jid: string,
    _name: string,
  ) {
    throw new Error('Newsletter functions not available in whaileys 6.4.3');
  }

  async newsletterUpdateDescription(
    _sessionName: string,
    _jid: string,
    _description: string,
  ) {
    throw new Error('Newsletter functions not available in whaileys 6.4.3');
  }

  async newsletterDelete(_sessionName: string, _jid: string) {
    throw new Error('Newsletter functions not available in whaileys 6.4.3');
  }

  async newsletterReactMessage(
    _sessionName: string,
    _jid: string,
    _messageId: string,
    _reaction: string,
  ) {
    throw new Error('Newsletter functions not available in whaileys 6.4.3');
  }
}
