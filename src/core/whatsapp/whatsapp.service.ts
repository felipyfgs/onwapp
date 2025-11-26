import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import makeWASocket, {
  WASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} from 'whaileys';
import { Proxy } from '@prisma/client';
import * as P from 'pino';
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
  LabelsHandler,
  GroupsExtendedHandler,
  NewsletterHandler,
  MiscHandler,
  ContactsHandler,
  GroupsPersistenceHandler,
  CallsHandler,
  PresenceHandler,
  BlocklistHandler,
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
    private readonly labelsHandler: LabelsHandler,
    private readonly groupsExtendedHandler: GroupsExtendedHandler,
    private readonly newsletterHandler: NewsletterHandler,
    private readonly miscHandler: MiscHandler,
    private readonly contactsHandler: ContactsHandler,
    private readonly groupsPersistenceHandler: GroupsPersistenceHandler,
    private readonly callsHandler: CallsHandler,
    private readonly presenceHandler: PresenceHandler,
    private readonly blocklistHandler: BlocklistHandler,
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

    // Fechar socket existente se houver (evita conflitos)
    const existingSocket = this.socketManager.getSocket(sessionId);
    if (existingSocket) {
      this.logger.log(`[${sid}] Fechando socket existente antes de reconectar`);
      try {
        existingSocket.end(undefined);
      } catch {
        // Ignorar erros ao fechar socket antigo
      }
      this.socketManager.deleteSocket(sessionId);
    }

    const { state, saveCreds } = await useAuthState(sessionId, this.prisma);
    const currentQRRef: QRCodeRef = { value: undefined };

    // Log proxy configuration (proxy implementation requires additional setup)
    if (proxyConfig?.enabled && proxyConfig.host && proxyConfig.port) {
      this.logger.log(
        `[${sid}] Proxy configurado: ${proxyConfig.protocol ?? 'http'}://${proxyConfig.host}:${proxyConfig.port}`,
      );
      // TODO: Implement proxy agent with https-proxy-agent or socks-proxy-agent
    }

    // Buscar versão mais recente do WhatsApp Web (como Evolution API faz)
    const { version } = await fetchLatestBaileysVersion();
    this.logger.log(`[${sid}] WhatsApp Web version: ${version.join('.')}`);

    // Configurar browser fingerprint (padrão Evolution API)
    const browser = Browsers.ubuntu('Chrome');

    const socket = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(
          state.keys,
          P.default({ level: 'silent' }) as any,
        ),
      },
      version,
      browser,
      printQRInTerminal: false,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      emitOwnEvents: false, // Evita conflitos de eventos
      fireInitQueries: true, // Importante para inicialização
      connectTimeoutMs: 30_000,
      keepAliveIntervalMs: 30_000,
      retryRequestDelayMs: 350,
      logger: createSilentLogger() as unknown as Parameters<
        typeof makeWASocket
      >[0]['logger'],
    });

    // Usar ev.process() como a Evolution API faz (processa eventos em lote)
    socket.ev.process(async (events) => {
      // Connection update
      if (events['connection.update']) {
        const update = events['connection.update'];
        await this.connectionHandler.createConnectionUpdateHandler(
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
      }

      // Credentials update
      if (events['creds.update']) {
        this.connectionHandler.handleCredsUpdate(sessionId, saveCreds);
      }

      // Messages
      if (events['messages.upsert']) {
        this.messagesHandler.handleMessagesUpsert(
          sessionId,
          socket,
          events['messages.upsert'],
        );
      }

      if (events['messages.update']) {
        this.messagesHandler.handleMessagesUpdate(
          sessionId,
          events['messages.update'],
        );
      }

      // Chats (using type assertion due to complex Whaileys types with Long/null)
      if (events['chats.upsert']) {
        this.chatsHandler.handleChatsUpsert(
          sessionId,
          events['chats.upsert'] as any,
        );
      }

      if (events['chats.update']) {
        this.chatsHandler.handleChatsUpdate(
          sessionId,
          events['chats.update'] as any,
        );
      }

      // History
      if (events['messaging-history.set']) {
        this.historyHandler.handleHistorySet(
          sessionId,
          events['messaging-history.set'] as any,
        );
      }

      // Labels (WhatsApp Business) - available in newer whaileys versions
      if (events['labels.edit']) {
        void this.labelsHandler.handleLabelsEdit(
          sessionId,
          events['labels.edit'] as any,
        );
      }

      if (events['labels.association']) {
        void this.labelsHandler.handleLabelsAssociation(
          sessionId,
          events['labels.association'] as any,
        );
      }

      // Group join requests - available in newer whaileys versions
      if (events['group.join-request']) {
        void this.groupsExtendedHandler.handleGroupJoinRequest(
          sessionId,
          events['group.join-request'] as any,
        );
      }

      // LID mapping - available in newer whaileys versions
      if (events['lid-mapping.update']) {
        void this.miscHandler.handleLidMappingUpdate(
          sessionId,
          events['lid-mapping.update'] as any,
        );
      }

      // Newsletter events - available in newer whaileys versions
      if (events['newsletter.reaction']) {
        void this.newsletterHandler.handleNewsletterReaction(
          sessionId,
          events['newsletter.reaction'] as any,
        );
      }

      if (events['newsletter.view']) {
        void this.newsletterHandler.handleNewsletterView(
          sessionId,
          events['newsletter.view'] as any,
        );
      }

      if (events['newsletter-participants.update']) {
        void this.newsletterHandler.handleNewsletterParticipantsUpdate(
          sessionId,
          events['newsletter-participants.update'] as any,
        );
      }

      if (events['newsletter-settings.update']) {
        void this.newsletterHandler.handleNewsletterSettingsUpdate(
          sessionId,
          events['newsletter-settings.update'] as any,
        );
      }

      // Contacts persistence
      if (events['contacts.upsert']) {
        void this.contactsHandler.handleContactsUpsert(
          sessionId,
          events['contacts.upsert'] as any,
        );
      }

      if (events['contacts.update']) {
        void this.contactsHandler.handleContactsUpdate(
          sessionId,
          events['contacts.update'] as any,
        );
      }

      // Groups persistence
      if (events['groups.upsert']) {
        void this.groupsPersistenceHandler.handleGroupsUpsert(
          sessionId,
          events['groups.upsert'] as any,
        );
      }

      if (events['groups.update']) {
        void this.groupsPersistenceHandler.handleGroupsUpdate(
          sessionId,
          events['groups.update'] as any,
        );
      }

      if (events['group-participants.update']) {
        void this.groupsPersistenceHandler.handleGroupParticipantsUpdate(
          sessionId,
          events['group-participants.update'] as any,
        );
      }

      // Chats delete
      if (events['chats.delete']) {
        this.chatsHandler.handleChatsDelete(sessionId, events['chats.delete']);
      }

      // Presence (cache only)
      if (events['presence.update']) {
        this.presenceHandler.handlePresenceUpdate(
          sessionId,
          events['presence.update'] as any,
        );
      }

      // Calls
      if (events['call']) {
        const settings = await this.prisma.sessionSettings.findUnique({
          where: { sessionId },
        });
        void this.callsHandler.handleCall(
          sessionId,
          socket,
          events['call'] as any,
          settings?.rejectCall ?? false,
        );
      }

      // Messages delete
      if (events['messages.delete']) {
        this.messagesHandler.handleMessagesDelete(
          sessionId,
          events['messages.delete'] as any,
        );
      }

      // Messages reaction
      if (events['messages.reaction']) {
        this.messagesHandler.handleMessagesReaction(
          sessionId,
          events['messages.reaction'] as any,
        );
      }

      // Message receipt update
      if (events['message-receipt.update']) {
        this.messagesHandler.handleMessageReceiptUpdate(
          sessionId,
          events['message-receipt.update'] as any,
        );
      }

      // Messages media update
      if (events['messages.media-update']) {
        this.messagesHandler.handleMessagesMediaUpdate(
          sessionId,
          events['messages.media-update'] as any,
        );
      }

      // Blocklist
      if (events['blocklist.set']) {
        const blocklist = events['blocklist.set'] as { blocklist: string[] };
        this.blocklistHandler.handleBlocklistSet(
          sessionId,
          blocklist.blocklist || [],
        );
      }

      if (events['blocklist.update']) {
        this.blocklistHandler.handleBlocklistUpdate(
          sessionId,
          events['blocklist.update'] as any,
        );
      }
    });

    // Register webhook listeners (esses podem ficar separados)
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
