import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import makeWASocket, { WASocket } from 'whaileys';
import { Proxy } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { AuthStateRepository } from '../../database/repositories/auth-state.repository';
import { SessionRepository } from '../../database/repositories/session.repository';
import { SocketManager } from './managers/socket.manager';
import { useAuthState } from './auth-state';
import { WebhooksService } from '../../integrations/webhooks/webhooks.service';
import {
  ConnectionHandler,
  MessagesHandler,
  ChatsHandler,
  HistoryHandler,
} from './handlers';
import { SessionData, QRCodeRef } from './whatsapp.types';
import { formatSessionId, createSilentLogger } from './utils/helpers';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private sessionData: Map<string, SessionData> = new Map();

  constructor(
    private readonly prisma: DatabaseService,
    private readonly socketManager: SocketManager,
    private readonly authStateRepository: AuthStateRepository,
    private readonly sessionRepository: SessionRepository,
    @Inject(forwardRef(() => WebhooksService))
    private readonly webhooksService: WebhooksService,
    private readonly connectionHandler: ConnectionHandler,
    private readonly messagesHandler: MessagesHandler,
    private readonly chatsHandler: ChatsHandler,
    private readonly historyHandler: HistoryHandler,
  ) {}

  async reconnectActiveSessions(): Promise<void> {
    const activeSessions = await this.sessionRepository.findAllConnected();

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

  private async registerWebhookListeners(
    sessionId: string,
    socket: WASocket,
  ): Promise<void> {
    try {
      const webhook = await this.webhooksService.findBySessionId(sessionId);
      const sid = formatSessionId(sessionId);

      if (!webhook || !webhook.enabled || webhook.events.length === 0) {
        return;
      }

      webhook.events.forEach((event) => {
        socket.ev.on(event as never, (payload: unknown) => {
          void this.webhooksService.trigger(sessionId, event, payload);
        });
      });

      this.logger.log(
        `[${sid}] Webhooks registrados: ${webhook.events.length} evento(s)`,
      );
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao registrar webhooks: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  async createSocket(
    sessionId: string,
    proxyConfig?: Proxy | null,
  ): Promise<{ socket: WASocket; qr?: string }> {
    const hasExistingCreds =
      await this.authStateRepository.findBySessionAndType(sessionId, 'creds');
    const isNewLogin = !hasExistingCreds || hasExistingCreds.length === 0;

    const sid = formatSessionId(sessionId);
    this.logger.log(
      `[${sid}] Criando socket${isNewLogin ? ' | Novo login' : ' | Reconexão'}${proxyConfig?.enabled ? ' | Proxy habilitado' : ''}`,
    );

    const { state, saveCreds } = await useAuthState(sessionId, this.prisma);
    const currentQRRef: QRCodeRef = { value: undefined };

    // Log proxy configuration (proxy implementation requires additional setup)
    if (proxyConfig?.enabled && proxyConfig.host && proxyConfig.port) {
      this.logger.log(
        `[${sid}] Proxy configurado: ${proxyConfig.protocol ?? 'http'}://${proxyConfig.host}:${proxyConfig.port}`,
      );
      // TODO: Implement proxy agent with https-proxy-agent or socks-proxy-agent
      // This requires additional packages and configuration
    }

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: createSilentLogger() as unknown as Parameters<
        typeof makeWASocket
      >[0]['logger'],
    });

    // Connection events
    socket.ev.on('connection.update', (update: unknown) => {
      void this.connectionHandler.createConnectionUpdateHandler(
        sessionId,
        socket,
        saveCreds,
        currentQRRef,
        this.sessionData,
        (sid, delay) => this.scheduleReconnect(sid, delay),
      )(
        update as {
          connection?: string;
          lastDisconnect?: { error: Error };
          qr?: string;
        },
      );
    });

    socket.ev.on('creds.update', () => {
      this.connectionHandler.handleCredsUpdate(sessionId, saveCreds);
    });

    // Register all event handlers
    this.messagesHandler.registerMessageListeners(sessionId, socket);
    this.chatsHandler.registerChatListeners(sessionId, socket);
    this.historyHandler.registerHistoryListeners(sessionId, socket);

    // Register webhook listeners
    void this.registerWebhookListeners(sessionId, socket);

    // Store socket and session data
    this.socketManager.createSocket(sessionId, socket);
    this.sessionData.set(sessionId, {
      qrCode: currentQRRef.value,
      isNewLogin,
      logoutAttempts: 0,
    });

    return { socket, qr: currentQRRef.value };
  }

  getSocket(sessionId: string): WASocket | undefined {
    return this.socketManager.getSocket(sessionId);
  }

  getQRCode(sessionId: string): string | undefined {
    return this.sessionData.get(sessionId)?.qrCode;
  }

  async disconnectSocket(sessionId: string): Promise<void> {
    const socket = this.socketManager.getSocket(sessionId);
    if (socket) {
      await socket.logout();
      this.socketManager.deleteSocket(sessionId);
      this.sessionData.delete(sessionId);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.disconnectSocket(sessionId);
  }
}
