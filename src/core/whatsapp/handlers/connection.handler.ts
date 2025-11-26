import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { WASocket, DisconnectReason } from 'whaileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import * as QRCode from 'qrcode';
import { SessionRepository } from '../../../database/repositories/session.repository';
import { AuthStateRepository } from '../../../database/repositories/auth-state.repository';
import { SocketManager } from '../managers/socket.manager';
import { ChatwootBotService } from '../../../integrations/chatwoot/services/chatwoot-bot.service';
import { ChatwootConfigService } from '../../../integrations/chatwoot/services/chatwoot-config.service';
import { SessionData, QRCodeRef } from '../whatsapp.types';
import {
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
    @Inject(forwardRef(() => ChatwootBotService))
    private readonly chatwootBotService: ChatwootBotService,
    @Inject(forwardRef(() => ChatwootConfigService))
    private readonly chatwootConfigService: ChatwootConfigService,
  ) {}

  async handleQRCode(
    sessionId: string,
    qr: string,
    sessionData: Map<string, SessionData>,
    pairingCode?: string,
  ): Promise<void> {
    const sessionDataEntry = sessionData.get(sessionId);
    if (sessionDataEntry) {
      sessionDataEntry.qrCode = qr;
    }
    this.logger.log('QR Code gerado', {
      event: 'whatsapp.qr.generated',
      sessionId,
    });
    qrcode.generate(qr, { small: true });
    await this.updateSessionStatus(sessionId, {
      qrCode: qr,
      status: 'connecting',
    });

    // Send QR code to Chatwoot if enabled
    await this.sendQRCodeToChatwoot(sessionId, qr, pairingCode);
  }

  /**
   * Send QR code to Chatwoot bot conversation
   */
  private async sendQRCodeToChatwoot(
    sessionId: string,
    qr: string,
    pairingCode?: string,
  ): Promise<void> {
    try {
      const config = await this.chatwootConfigService.getConfig(sessionId);
      if (!config?.enabled) return;

      // Generate QR code as base64 image
      const qrBase64 = await QRCode.toDataURL(qr, {
        width: 300,
        margin: 2,
      });

      await this.chatwootBotService.sendQRCode(
        sessionId,
        qrBase64,
        pairingCode,
      );
    } catch (error) {
      this.logger.warn('Falha ao enviar QR para Chatwoot', {
        event: 'chatwoot.qr.send.failure',
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
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
    this.logger.log('Sessão conectada', {
      event: 'whatsapp.connection.open',
      sessionId,
      phoneNumber: phoneNumber ? `+${phoneNumber}` : undefined,
    });

    await this.updateSessionStatus(sessionId, {
      status: 'connected',
      qrCode: null,
      phone: phoneNumber,
    });

    // Send connection notification to Chatwoot
    await this.sendConnectionStatusToChatwoot(sessionId, 'connected');
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

    this.logger.log('Sessão desconectada', {
      event: 'whatsapp.connection.close',
      sessionId,
      statusCode,
      shouldReconnect,
      logoutAttempts: currentLogoutAttempts,
    });

    this.socketManager.deleteSocket(sessionId);
    sessionData.delete(sessionId);

    // 401 = loggedOut - sessão foi invalidada (logout do celular, etc)
    if (isLoggedOut) {
      this.logger.warn('Sessão invalidada', {
        event: 'whatsapp.session.logout',
        sessionId,
        reason: 'loggedOut',
      });
      await this.clearSessionCredentials(sessionId);
      await this.updateSessionStatus(sessionId, {
        status: 'disconnected',
        qrCode: null,
      });
      // Send disconnection notification to Chatwoot
      await this.sendConnectionStatusToChatwoot(sessionId, 'disconnected');
      return; // Não reconectar
    }

    // 515 = restartRequired - apenas reiniciar conexão
    if (isRestartRequired) {
      await this.updateSessionStatus(sessionId, { status: 'connecting' });
    } else {
      await this.updateSessionStatus(sessionId, { status: 'disconnected' });
      // Send disconnection notification to Chatwoot
      await this.sendConnectionStatusToChatwoot(sessionId, 'disconnected');
    }

    if (shouldReconnect) {
      const delay = getReconnectDelay(statusCode);
      onReconnect(sessionId, delay);
    }
  }

  /**
   * Send connection status notification to Chatwoot
   */
  private async sendConnectionStatusToChatwoot(
    sessionId: string,
    status: 'connected' | 'disconnected' | 'connecting' | 'qr_timeout',
  ): Promise<void> {
    try {
      const config = await this.chatwootConfigService.getConfig(sessionId);
      if (!config?.enabled) return;

      await this.chatwootBotService.sendConnectionStatus(sessionId, status);
    } catch (error) {
      this.logger.warn('Falha ao enviar status para Chatwoot', {
        event: 'chatwoot.status.send.failure',
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  handleCredsUpdate(sessionId: string, saveCreds: () => Promise<void>): void {
    saveCreds().catch((err) => {
      this.logger.error('Falha ao salvar credenciais', {
        event: 'whatsapp.creds.save.failure',
        sessionId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
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
      this.logger.error('Erro ao atualizar status da sessão', {
        event: 'session.status.update.failure',
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async clearSessionCredentials(sessionId: string): Promise<void> {
    try {
      await this.authStateRepository.deleteBySession(sessionId);
    } catch (error) {
      this.logger.error('Erro ao limpar credenciais da sessão', {
        event: 'session.creds.clear.failure',
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
