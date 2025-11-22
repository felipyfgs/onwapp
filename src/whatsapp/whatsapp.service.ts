import { Injectable, Logger } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  AuthenticationState,
  SignalDataTypeMap,
  initAuthCreds,
  BufferJSON,
} from 'whaileys';
import { Boom } from '@hapi/boom';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

interface SessionSocket {
  socket: WASocket;
  qrCode?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private sessions: Map<string, SessionSocket> = new Map();
  private readonly authDir = path.join(process.cwd(), 'auth_sessions');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  async createSocket(sessionId: string): Promise<{ socket: WASocket; qr?: string }> {
    const authState = await this.loadAuthState(sessionId);
    let currentQR: string | undefined;

    const socket = makeWASocket({
      auth: authState,
      printQRInTerminal: false,
      logger: {
        level: 'silent',
        fatal: () => {},
        error: () => {},
        warn: () => {},
        info: () => {},
        debug: () => {},
        trace: () => {},
        child: () => this as any,
      },
    });

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQR = qr;
        this.logger.log(`QR Code gerado para sessão ${sessionId}`);
        await this.prisma.session.update({
          where: { sessionId },
          data: { qrCode: qr, status: 'connecting' },
        });
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

        this.logger.log(
          `Conexão fechada para ${sessionId}, reconectar: ${shouldReconnect}`,
        );

        await this.prisma.session.update({
          where: { sessionId },
          data: { status: 'disconnected' },
        });

        this.sessions.delete(sessionId);

        if (shouldReconnect) {
          setTimeout(() => this.createSocket(sessionId), 3000);
        }
      } else if (connection === 'open') {
        this.logger.log(`Sessão ${sessionId} conectada com sucesso`);
        await this.prisma.session.update({
          where: { sessionId },
          data: { status: 'connected', qrCode: null },
        });
      } else if (connection === 'connecting') {
        await this.prisma.session.update({
          where: { sessionId },
          data: { status: 'connecting' },
        });
      }
    });

    socket.ev.on('creds.update', async () => {
      await this.saveAuthState(sessionId, authState);
    });

    this.sessions.set(sessionId, { socket, qrCode: currentQR });

    return { socket, qr: currentQR };
  }

  async loadAuthState(sessionId: string): Promise<AuthenticationState> {
    const authDir = path.join(this.authDir, sessionId);

    if (fs.existsSync(authDir)) {
      const { state } = await useMultiFileAuthState(authDir);
      return state;
    }

    const creds = initAuthCreds();
    const keys: SignalDataTypeMap = {
      'pre-key': {},
      'session': {},
      'sender-key': {},
      'app-state-sync-key': {},
      'app-state-sync-version': {},
      'sender-key-memory': {},
    };

    return {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: any = {};
          for (const id of ids) {
            let value = keys[type][id];
            if (value) {
              if (type === 'app-state-sync-key') {
                value = JSON.parse(JSON.stringify(value), BufferJSON.reviver);
              }
              data[id] = value;
            }
          }
          return data;
        },
        set: async (data) => {
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              keys[category][id] = value;
            }
          }
        },
      },
    };
  }

  async saveAuthState(sessionId: string, state: AuthenticationState): Promise<void> {
    const authDir = path.join(this.authDir, sessionId);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(authDir, 'creds.json'),
      JSON.stringify(state.creds, BufferJSON.replacer, 2),
    );
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
    const authDir = path.join(this.authDir, sessionId);
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
  }
}
