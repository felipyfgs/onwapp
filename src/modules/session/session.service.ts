import { Injectable, OnModuleDestroy } from '@nestjs/common';
import makeWASocket, {
  AnyMessageContent,
  ConnectionState,
  DisconnectReason,
  useMultiFileAuthState,
  type WASocket,
} from 'whaileys';
import qrcodeTerminal from 'qrcode-terminal';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LoggerService } from '../../logger/logger.service';
import { MessageService } from '../message/message.service';

const SESSION_DIR = process.env.WHATS_SESSION_DIR || './whats-session';

interface SessionInfo {
  socket: WASocket | null;
  status: ConnectionState['connection'];
  qr?: string;
  user?: any;
}

@Injectable()
export class SessionService implements OnModuleDestroy {
  private sessions = new Map<string, SessionInfo>();

  constructor(
    private readonly logger: LoggerService,
    private readonly messageService: MessageService,
  ) {}

  async onModuleDestroy() {
    for (const [id] of this.sessions) {
      await this.deleteSession(id);
    }
  }

  async createSession(id: string): Promise<void> {
    const sessionPath = path.join(SESSION_DIR, id);
    await fs.mkdir(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const socket = makeWASocket({
      printQRInTerminal: false,
      auth: state,
    });

    socket.ev.on('connection.update', (update) => {
      this.handleConnectionUpdate(id, update);
    });
    socket.ev.on('messages.upsert', ({ messages }) => {
      this.handleMessagesUpsert(id, messages);
    });
    socket.ev.on('creds.update', saveCreds);

    this.sessions.set(id, { socket, status: 'connecting' });
    this.logger.log(`Sessão ${id} criada e iniciando conexão.`);
  }

  async getSessions(): Promise<string[]> {
    return Array.from(this.sessions.keys());
  }

  async getSession(id: string): Promise<SessionInfo | undefined> {
    return this.sessions.get(id);
  }

  async deleteSession(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (session?.socket) {
      const ws = session.socket.ws as { close: () => Promise<void> };
      await ws.close();
    }
    this.sessions.delete(id);
    const sessionPath = path.join(SESSION_DIR, id);
    try {
      await fs.rm(sessionPath, { recursive: true, force: true });
    } catch (err) {
      this.logger.warn(`Erro ao deletar pasta ${sessionPath}:`, err);
    }
  }

  async connectSession(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (session?.socket) {
      // Já existe, reconectar se fechado
      if (session.status === 'close') {
        await this.deleteSession(id);
        await this.createSession(id);
      }
    } else {
      await this.createSession(id);
    }
  }

  async disconnectSession(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (session?.socket) {
      const ws = session.socket.ws as { close: () => Promise<void> };
      await ws.close();
      session.status = 'close';
    }
  }

  async getQRCode(id: string): Promise<string | undefined> {
    const session = this.sessions.get(id);
    return session?.qr;
  }

  async getSessionStatus(id: string): Promise<ConnectionState['connection'] | undefined> {
    const session = this.sessions.get(id);
    return session?.status;
  }

  async pairPhone(id: string, phoneNumber: string): Promise<string> {
    const session = this.sessions.get(id);
    if (!session?.socket) {
      throw new Error('Sessão não conectada');
    }
    const code = await session.socket.requestPairingCode(phoneNumber);
    return code;
  }

  private async handleConnectionUpdate(id: string, update: Partial<ConnectionState>) {
    const session = this.sessions.get(id);
    if (!session) return;

    this.logger.log(`Sessão ${id}: connection.update`, update);

    if (update.qr) {
      session.qr = update.qr;
      qrcodeTerminal.generate(update.qr, { small: true });
    }

    if (update.connection === 'open') {
      session.status = 'open';
      if (update.user) {
        session.user = update.user;
      }
      session.qr = undefined;
    } else if (update.connection === 'close') {
      session.status = 'close';
      const shouldReconnect =
        (update.lastDisconnect?.error as BaileysDisconnectError)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        this.logger.log(`Sessão ${id} reconectando...`);
        setTimeout(() => this.connectSession(id), 3000);
      }
    }
  }

  private handleMessagesUpsert(id: string, messages: any[]) {
    const incoming = messages.find((msg) => msg?.message);
    if (incoming) {
      this.messageService.handleMessage(incoming).catch(this.logger.error);
    }
  }

  async sendMessage(id: string, jid: string, content: AnyMessageContent): Promise<any> {
    const session = this.sessions.get(id);
    if (!session?.socket) {
      throw new Error('Sessão não disponível');
    }
    return session.socket.sendMessage(jid, content);
  }
}
