import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  WASocket,
} from 'whaileys';
import { Boom } from '@hapi/boom';
import { PrismaService } from '../prisma/prisma.service';
import * as qrcode from 'qrcode-terminal';
import { useAuthState } from './auth-state';

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
export class WhatsAppService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppService.name);
  private sessions: Map<string, SessionSocket> = new Map();

  constructor(private prisma: PrismaService) {}

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

  private async reconnectActiveSessions(): Promise<void> {
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

  async onModuleInit() {
    await this.reconnectActiveSessions();
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
