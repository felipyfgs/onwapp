import { Injectable, Logger } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  WASocket,
} from 'whaileys';
import { Boom } from '@hapi/boom';
import { PrismaService } from '../prisma/prisma.service';
import * as qrcode from 'qrcode-terminal';
import { usePostgresAuthState } from './postgres-auth-state';

interface SessionSocket {
  socket: WASocket;
  qrCode?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private sessions: Map<string, SessionSocket> = new Map();

  constructor(private prisma: PrismaService) {}

  async createSocket(
    sessionId: string,
  ): Promise<{ socket: WASocket; qr?: string }> {
    const { state, saveCreds } = await usePostgresAuthState(
      sessionId,
      this.prisma,
    );
    let currentQR: string | undefined;

    const customLogger = {
      level: 'silent',
      fatal: (...args: any[]) => {},
      error: (...args: any[]) => {},
      warn: (...args: any[]) => {},
      info: (...args: any[]) => {},
      debug: (...args: any[]) => {},
      trace: (...args: any[]) => {},
      silent: (...args: any[]) => {},
      child: () => customLogger,
    };

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: customLogger as any,
    });

    socket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQR = qr;
        const sessionSocket = this.sessions.get(sessionId);
        if (sessionSocket) {
          sessionSocket.qrCode = qr;
        }
        this.logger.log(`QR Code gerado para sessão ${sessionId}`);
        qrcode.generate(qr, { small: true });
        this.prisma.session
          .update({
            where: { sessionId },
            data: { qrCode: qr, status: 'connecting' },
          })
          .catch((err) => this.logger.error('Error updating session QR', err));
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect =
          statusCode !== (DisconnectReason.loggedOut as unknown as number);

        this.logger.log(
          `Conexão fechada para ${sessionId}, reconectar: ${shouldReconnect}`,
        );

        this.prisma.session
          .update({
            where: { sessionId },
            data: { status: 'disconnected' },
          })
          .catch((err) =>
            this.logger.error('Error updating session status', err),
          );

        this.sessions.delete(sessionId);

        if (shouldReconnect) {
          setTimeout(() => {
            this.createSocket(sessionId).catch((err) =>
              this.logger.error('Error reconnecting socket', err),
            );
          }, 3000);
        }
      } else if (connection === 'open') {
        this.logger.log(`Sessão ${sessionId} conectada com sucesso`);
        this.prisma.session
          .update({
            where: { sessionId },
            data: { status: 'connected', qrCode: null },
          })
          .catch((err) =>
            this.logger.error('Error updating session status', err),
          );
      } else if (connection === 'connecting') {
        this.prisma.session
          .update({
            where: { sessionId },
            data: { status: 'connecting' },
          })
          .catch((err) =>
            this.logger.error('Error updating session status', err),
          );
      }
    });

    socket.ev.on('creds.update', () => {
      saveCreds().catch((err) =>
        this.logger.error('Error saving auth state', err),
      );
    });

    this.sessions.set(sessionId, { socket, qrCode: currentQR });

    return { socket, qr: currentQR };
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
