import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnApplicationBootstrap,
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

export interface SessionInstance {
  socket: WASocket;
  status: SessionStatus;
  qrcode?: string;
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

    socket.ev.on('messages.upsert', (payload) => {
      pinoLogger.info(
        { event: 'messages.upsert', payload },
        `messages.upsert (${payload.type}): ${payload.messages.length} messages`,
      );
    });

    socket.ev.on('messages.update', (payload) => {
      pinoLogger.info(
        { event: 'messages.update', payload },
        `messages.update: ${payload.length} updates`,
      );
    });

    socket.ev.on('messages.reaction', (payload) => {
      pinoLogger.info(
        { event: 'messages.reaction', payload },
        `messages.reaction: ${payload.length} reactions`,
      );
    });

    socket.ev.on('message-receipt.update', (payload) => {
      pinoLogger.info(
        { event: 'message-receipt.update', payload },
        `message-receipt.update: ${payload.length} receipts`,
      );
    });

    socket.ev.on('chats.upsert', (payload) => {
      pinoLogger.info(
        { event: 'chats.upsert', payload },
        `chats.upsert: ${payload.length} chats`,
      );
    });

    socket.ev.on('chats.update', (payload) => {
      pinoLogger.info(
        { event: 'chats.update', payload },
        `chats.update: ${payload.length} chats`,
      );
    });

    socket.ev.on('chats.delete', (payload) => {
      pinoLogger.info(
        { event: 'chats.delete', payload },
        `chats.delete: ${payload.length} chats`,
      );
    });

    socket.ev.on('contacts.upsert', (payload) => {
      pinoLogger.info(
        { event: 'contacts.upsert', payload },
        `contacts.upsert: ${payload.length} contacts`,
      );
    });

    socket.ev.on('contacts.update', (payload) => {
      pinoLogger.info(
        { event: 'contacts.update', payload },
        `contacts.update: ${payload.length} contacts`,
      );
    });

    socket.ev.on('groups.upsert', (payload) => {
      pinoLogger.info(
        { event: 'groups.upsert', payload },
        `groups.upsert: ${payload.length} groups`,
      );
    });

    socket.ev.on('groups.update', (payload) => {
      pinoLogger.info(
        { event: 'groups.update', payload },
        `groups.update: ${payload.length} groups`,
      );
    });

    socket.ev.on('group-participants.update', (payload) => {
      pinoLogger.info(
        { event: 'group-participants.update', payload },
        `group-participants.update: ${payload.action} ${payload.participants.length} in ${payload.id}`,
      );
    });

    socket.ev.on('presence.update', (payload) => {
      const entries = Object.entries(payload.presences);
      pinoLogger.info(
        { event: 'presence.update', payload },
        `presence.update: ${entries.length} presences in ${payload.id}`,
      );
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
    });
  }

  private async handleConnectionUpdate(
    name: string,
    sessionInstance: SessionInstance,
    socket: WASocket,
    update: Partial<ConnectionState>,
  ) {
    const { connection, lastDisconnect, qr } = update;

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
}
