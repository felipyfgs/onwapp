import { Injectable, Logger } from '@nestjs/common';
import { WASocket, DisconnectReason } from 'whaileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import { SessionRepository } from '../../../database/repositories/session.repository';
import { AuthStateRepository } from '../../../database/repositories/auth-state.repository';
import { SocketManager } from '../managers/socket.manager';
import { SessionData, QRCodeRef } from '../whatsapp.types';
import {
  formatSessionId,
  extractPhoneNumber,
  shouldReconnectSession,
  getReconnectDelay,
} from '../utils/helpers';

@Injectable()
export class ConnectionHandler {
  private readonly logger = new Logger(ConnectionHandler.name);

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly authStateRepository: AuthStateRepository,
    private readonly socketManager: SocketManager,
  ) {}

  async handleQRCode(
    sessionId: string,
    qr: string,
    sessionData: Map<string, SessionData>,
  ): Promise<void> {
    const sessionDataEntry = sessionData.get(sessionId);
    if (sessionDataEntry) {
      sessionDataEntry.qrCode = qr;
    }
    const sid = formatSessionId(sessionId);
    this.logger.log(`[${sid}] QR gerado`);
    qrcode.generate(qr, { small: true });
    await this.updateSessionStatus(sessionId, {
      qrCode: qr,
      status: 'connecting',
    });
  }

  async handleConnectionOpen(
    sessionId: string,
    socket: WASocket,
    sessionData: Map<string, SessionData>,
  ): Promise<void> {
    const sessionDataEntry = sessionData.get(sessionId);
    if (sessionDataEntry) {
      sessionDataEntry.logoutAttempts = 0;
      sessionDataEntry.isNewLogin = false;
    }

    const phoneNumber = extractPhoneNumber(socket);
    const sid = formatSessionId(sessionId);
    this.logger.log(
      `[${sid}] ✓ Conectado${phoneNumber ? ` | Tel: +${phoneNumber}` : ''}`,
    );

    await this.updateSessionStatus(sessionId, {
      status: 'connected',
      qrCode: null,
      phone: phoneNumber,
    });
  }

  async handleConnectionClose(
    sessionId: string,
    statusCode: DisconnectReason,
    sessionData: Map<string, SessionData>,
    onReconnect: (sessionId: string, delay: number) => void,
  ): Promise<void> {
    const isLoggedOut = statusCode === DisconnectReason.loggedOut;
    const isRestartRequired = statusCode === DisconnectReason.restartRequired;

    const sessionDataEntry = sessionData.get(sessionId);
    const currentLogoutAttempts = (sessionDataEntry?.logoutAttempts ?? 0) + 1;
    const shouldReconnect = shouldReconnectSession(
      statusCode,
      currentLogoutAttempts,
    );

    const sid = formatSessionId(sessionId);
    this.logger.log(
      `[${sid}] ✗ Desconectado | Code: ${statusCode} | Retry: ${shouldReconnect ? `✓ (${currentLogoutAttempts})` : '✗'}`,
    );

    this.socketManager.deleteSocket(sessionId);
    sessionData.delete(sessionId);

    // 401 = loggedOut - sessão foi invalidada (logout do celular, etc)
    if (isLoggedOut) {
      this.logger.warn(
        `[${sid}] Sessão invalidada (loggedOut) | Limpando credenciais`,
      );
      await this.clearSessionCredentials(sessionId);
      await this.updateSessionStatus(sessionId, {
        status: 'disconnected',
        qrCode: null,
      });
      return; // Não reconectar
    }

    // 515 = restartRequired - apenas reiniciar conexão
    if (isRestartRequired) {
      await this.updateSessionStatus(sessionId, { status: 'connecting' });
    } else {
      await this.updateSessionStatus(sessionId, { status: 'disconnected' });
    }

    if (shouldReconnect) {
      const delay = getReconnectDelay(statusCode);
      onReconnect(sessionId, delay);
    }
  }

  handleCredsUpdate(sessionId: string, saveCreds: () => Promise<void>): void {
    saveCreds().catch((err) => {
      const sid = formatSessionId(sessionId);
      this.logger.error(
        `[${sid}] Falha ao salvar credenciais: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
      );
    });
  }

  createConnectionUpdateHandler(
    sessionId: string,
    socket: WASocket,
    saveCreds: () => Promise<void>,
    currentQRRef: QRCodeRef,
    sessionData: Map<string, SessionData>,
    onReconnect: (sessionId: string, delay: number) => void,
  ) {
    return async (update: {
      connection?: string;
      lastDisconnect?: { error: Error };
      qr?: string;
    }) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQRRef.value = qr;
        await this.handleQRCode(sessionId, qr, sessionData);
      }

      if (connection === 'open') {
        await this.handleConnectionOpen(sessionId, socket, sessionData);
      } else if (connection === 'connecting') {
        await this.updateSessionStatus(sessionId, { status: 'connecting' });
      } else if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output
          ?.statusCode as DisconnectReason;
        await this.handleConnectionClose(
          sessionId,
          statusCode,
          sessionData,
          onReconnect,
        );
      }
    };
  }

  private async updateSessionStatus(
    sessionId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.sessionRepository.update(sessionId, data);
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Operation: updateSessionStatus | Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  private async clearSessionCredentials(sessionId: string): Promise<void> {
    try {
      await this.authStateRepository.deleteBySession(sessionId);
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Operation: clearSessionCredentials | Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }
}
