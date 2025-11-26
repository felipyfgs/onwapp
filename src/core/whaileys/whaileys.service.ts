import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  ConnectionState,
  BaileysEventMap,
} from 'whaileys';
import { Boom } from '@hapi/boom';
import { PrismaService } from '../../database/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

export interface SessionInstance {
  socket: WASocket;
  status: string;
  qrcode?: string;
}

@Injectable()
export class WhaileysService implements OnModuleDestroy {
  private readonly logger = new Logger(WhaileysService.name);
  private sessions: Map<string, SessionInstance> = new Map();
  private readonly sessionsDir = path.join(process.cwd(), 'sessions');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  async onModuleDestroy() {
    for (const [name, session] of this.sessions) {
      this.logger.log(`Closing session: ${name}`);
      session.socket.end(undefined);
    }
  }

  async createSession(name: string): Promise<{ qrcode?: string; status: string }> {
    if (this.sessions.has(name)) {
      const session = this.sessions.get(name)!;
      return { qrcode: session.qrcode, status: session.status };
    }

    const sessionPath = path.join(this.sessionsDir, name);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });

    const sessionInstance: SessionInstance = {
      socket,
      status: 'connecting',
    };

    this.sessions.set(name, sessionInstance);

    await this.prisma.session.upsert({
      where: { name },
      update: { status: 'connecting' },
      create: { name, status: 'connecting' },
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        sessionInstance.qrcode = qr;
        sessionInstance.status = 'qr';
        await this.prisma.session.update({
          where: { name },
          data: { qrcode: qr, status: 'qr' },
        });
        this.logger.log(`QR code generated for session: ${name}`);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        sessionInstance.status = 'disconnected';
        await this.prisma.session.update({
          where: { name },
          data: { status: 'disconnected', qrcode: null },
        });

        this.logger.warn(`Session ${name} disconnected. Reconnect: ${shouldReconnect}`);

        if (shouldReconnect) {
          this.sessions.delete(name);
          setTimeout(() => this.createSession(name), 3000);
        } else {
          this.sessions.delete(name);
          await this.deleteSessionFiles(name);
        }
      }

      if (connection === 'open') {
        const phone = socket.user?.id?.split(':')[0] || null;
        sessionInstance.status = 'connected';
        sessionInstance.qrcode = undefined;

        await this.prisma.session.update({
          where: { name },
          data: { status: 'connected', qrcode: null, phone },
        });

        this.logger.log(`Session ${name} connected. Phone: ${phone}`);
      }
    });

    socket.ev.on('messages.upsert', async (m: BaileysEventMap['messages.upsert']) => {
      this.logger.debug(`Messages received on session ${name}: ${m.messages.length}`);
    });

    return { status: 'connecting' };
  }

  async getSession(name: string): Promise<SessionInstance | null> {
    return this.sessions.get(name) || null;
  }

  async getAllSessions(): Promise<{ name: string; status: string; phone?: string }[]> {
    const dbSessions = await this.prisma.session.findMany();
    return dbSessions.map((s) => ({
      name: s.name,
      status: s.status,
      phone: s.phone || undefined,
    }));
  }

  async deleteSession(name: string): Promise<void> {
    const session = this.sessions.get(name);
    if (session) {
      session.socket.logout();
      this.sessions.delete(name);
    }

    await this.deleteSessionFiles(name);
    await this.prisma.session.delete({ where: { name } }).catch(() => {});

    this.logger.log(`Session ${name} deleted`);
  }

  private async deleteSessionFiles(name: string): Promise<void> {
    const sessionPath = path.join(this.sessionsDir, name);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
  }

  async sendMessage(sessionName: string, to: string, message: string): Promise<any> {
    const session = this.sessions.get(sessionName);
    if (!session || session.status !== 'connected') {
      throw new Error(`Session ${sessionName} not connected`);
    }

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    const result = await session.socket.sendMessage(jid, { text: message });
    this.logger.log(`Message sent from ${sessionName} to ${to}`);
    return result;
  }

  async restoreSessions(): Promise<void> {
    const sessions = await this.prisma.session.findMany({
      where: { status: { not: 'disconnected' } },
    });

    for (const session of sessions) {
      this.logger.log(`Restoring session: ${session.name}`);
      await this.createSession(session.name);
    }
  }

  async connectSession(name: string): Promise<{ qrcode?: string; status: string }> {
    const existingSession = this.sessions.get(name);
    if (existingSession && existingSession.status === 'connected') {
      return { status: 'connected' };
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

  private async startConnection(name: string): Promise<{ qrcode?: string; status: string }> {
    const sessionPath = path.join(this.sessionsDir, name);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });

    const sessionInstance: SessionInstance = {
      socket,
      status: 'connecting',
    };

    this.sessions.set(name, sessionInstance);

    await this.prisma.session.update({
      where: { name },
      data: { status: 'connecting' },
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        sessionInstance.qrcode = qr;
        sessionInstance.status = 'qr';
        await this.prisma.session.update({
          where: { name },
          data: { qrcode: qr, status: 'qr' },
        });
        this.logger.log(`QR code generated for session: ${name}`);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        sessionInstance.status = 'disconnected';
        await this.prisma.session.update({
          where: { name },
          data: { status: 'disconnected', qrcode: null },
        });

        this.logger.warn(`Session ${name} disconnected. Reconnect: ${shouldReconnect}`);

        if (shouldReconnect) {
          this.sessions.delete(name);
          setTimeout(() => this.startConnection(name), 3000);
        } else {
          this.sessions.delete(name);
        }
      }

      if (connection === 'open') {
        const phone = socket.user?.id?.split(':')[0] || null;
        sessionInstance.status = 'connected';
        sessionInstance.qrcode = undefined;

        await this.prisma.session.update({
          where: { name },
          data: { status: 'connected', qrcode: null, phone },
        });

        this.logger.log(`Session ${name} connected. Phone: ${phone}`);
      }
    });

    socket.ev.on('messages.upsert', async (m: BaileysEventMap['messages.upsert']) => {
      this.logger.debug(`Messages received on session ${name}: ${m.messages.length}`);
    });

    return { status: 'connecting' };
  }

  async getQr(name: string): Promise<string | null> {
    const session = this.sessions.get(name);
    if (session?.qrcode) {
      return session.qrcode;
    }

    const dbSession = await this.prisma.session.findUnique({ where: { name } });
    return dbSession?.qrcode || null;
  }

  async getStatus(name: string): Promise<{ status: string; phone?: string }> {
    const session = this.sessions.get(name);
    if (session) {
      const dbSession = await this.prisma.session.findUnique({ where: { name } });
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

    await this.prisma.session.update({
      where: { name },
      data: { status: 'logged_out', qrcode: null, phone: null },
    });

    await this.deleteSessionFiles(name);
    this.logger.log(`Session ${name} logged out`);
  }

  async restartSession(name: string): Promise<{ qrcode?: string; status: string }> {
    const session = this.sessions.get(name);
    if (session) {
      session.socket.end(undefined);
      this.sessions.delete(name);
    }

    await this.deleteSessionFiles(name);

    await this.prisma.session.update({
      where: { name },
      data: { status: 'disconnected', qrcode: null, phone: null },
    });

    this.logger.log(`Session ${name} restarting...`);
    return this.startConnection(name);
  }

  async getSessionInfo(name: string): Promise<{
    name: string;
    status: string;
    phone?: string;
    user?: any;
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
