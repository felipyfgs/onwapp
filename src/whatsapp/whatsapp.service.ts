import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
export class WhatsAppService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppService.name);
  private sessions: Map<string, SessionSocket> = new Map();

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Reconectando sessões ativas...');
    const activeSessions = await this.prisma.session.findMany({
      where: {
        status: {
          in: ['connected', 'connecting'],
        },
      },
    });

    for (const session of activeSessions) {
      this.logger.log(`Reconectando sessão ${session.id}`);
      try {
        await this.createSocket(session.id);
      } catch (err) {
        this.logger.error(`Erro ao reconectar sessão ${session.id}`, err);
      }
    }
  }

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

    socket.ev.on('connection.update', async (update) => {
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
            where: { id: sessionId },
            data: { qrCode: qr, status: 'connecting' },
          })
          .catch((err) => this.logger.error('Error updating session QR', err));
      }

      if (connection === 'open') {
        this.logger.log(`Sessão ${sessionId} conectada com sucesso`);
        this.prisma.session
          .update({
            where: { id: sessionId },
            data: { status: 'connected', qrCode: null },
          })
          .catch((err) =>
            this.logger.error('Error updating session status', err),
          );
      } else if (connection === 'connecting') {
        this.prisma.session
          .update({
            where: { id: sessionId },
            data: { status: 'connecting' },
          })
          .catch((err) =>
            this.logger.error('Error updating session status', err),
          );
      } else if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const isLoggedOut = statusCode === (DisconnectReason.loggedOut as unknown as number);
        const isUnauthorized = statusCode === 401;
        const shouldReconnect = !isLoggedOut && !isUnauthorized;

        this.logger.log(
          `Conexão fechada para ${sessionId}, reconectar: ${shouldReconnect}, statusCode: ${statusCode}, isLoggedOut: ${isLoggedOut}, isUnauthorized: ${isUnauthorized}`,
        );

        this.sessions.delete(sessionId);

        if (isUnauthorized || isLoggedOut) {
          this.logger.warn(`Sessão ${sessionId} invalidada, limpando credenciais`);
          await this.prisma.authState
            .deleteMany({
              where: { sessionId },
            })
            .catch((err) =>
              this.logger.error('Error clearing auth state', err),
            );
        }

        this.prisma.session
          .update({
            where: { id: sessionId },
            data: { status: 'disconnected' },
          })
          .catch((err) =>
            this.logger.error('Error updating session status', err),
          );

        if (shouldReconnect) {
          setTimeout(() => {
            this.createSocket(sessionId).catch((err) =>
              this.logger.error('Error reconnecting socket', err),
            );
          }, 3000);
        }
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
