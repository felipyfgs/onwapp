import { Injectable, OnModuleDestroy } from '@nestjs/common';
import makeWASocket, {
  AnyMessageContent,
  ConnectionState,
  DisconnectReason,
  WASocket,
} from 'whaileys';
import { LoggerService } from '../logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { useDatabaseAuthState } from './auth-state.provider';
import { SessionStatus } from '@prisma/client';

interface SessionInstance {
  id: string;
  socket: WASocket;
  status: SessionStatus;
  qrCode?: string;
}

@Injectable()
export class WhatsManagerService implements OnModuleDestroy {
  private sessions: Map<string, SessionInstance> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleDestroy() {
    // Desconectar todas as sessões ao destruir o módulo
    for (const [sessionId] of this.sessions) {
      await this.disconnectSession(sessionId);
    }
  }

  /**
   * Cria e conecta uma nova sessão WhatsApp
   */
  async connectSession(sessionId: string): Promise<void> {
    // Verificar se sessão já está conectada
    if (this.sessions.has(sessionId)) {
      this.logger.warn(`Sessão ${sessionId} já está conectada`);
      return;
    }

    // Verificar se sessão existe no banco
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Sessão ${sessionId} não encontrada`);
    }

    // Carregar auth state do banco
    const { state, saveCreds } = await useDatabaseAuthState(
      this.prisma,
      sessionId,
    );

    // Criar socket WhatsApp
    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    // Criar instância da sessão
    const instance: SessionInstance = {
      id: sessionId,
      socket,
      status: SessionStatus.connecting,
      qrCode: undefined,
    };

    this.sessions.set(sessionId, instance);

    // Configurar event handlers
    this.setupEventHandlers(sessionId, socket, saveCreds);

    // Atualizar status no banco
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.connecting },
    });

    this.logger.info(`Sessão ${sessionId} iniciando conexão`);
  }

  /**
   * Desconecta uma sessão WhatsApp
   */
  async disconnectSession(sessionId: string): Promise<void> {
    const instance = this.sessions.get(sessionId);

    if (!instance) {
      this.logger.warn(`Sessão ${sessionId} não está conectada`);
      return;
    }

    // Fechar WebSocket
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    void instance.socket.ws?.close();

    // Remover do mapa
    this.sessions.delete(sessionId);

    // Atualizar status no banco
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.disconnected,
        qrCode: null,
      },
    });

    this.logger.info(`Sessão ${sessionId} desconectada`);
  }

  /**
   * Obtém o QR Code atual de uma sessão
   */
  getQRCode(sessionId: string): string | null {
    const instance = this.sessions.get(sessionId);
    return instance?.qrCode || null;
  }

  /**
   * Obtém o status atual de uma sessão
   */
  getSessionStatus(sessionId: string): SessionStatus {
    const instance = this.sessions.get(sessionId);
    return instance?.status || SessionStatus.disconnected;
  }

  /**
   * Envia mensagem através de uma sessão
   */
  async sendMessage(
    sessionId: string,
    jid: string,
    content: AnyMessageContent,
  ): Promise<any> {
    const instance = this.sessions.get(sessionId);

    if (!instance) {
      throw new Error(`Sessão ${sessionId} não está conectada`);
    }

    if (instance.status !== SessionStatus.connected) {
      throw new Error(`Sessão ${sessionId} não está em estado conectado`);
    }

    return instance.socket.sendMessage(jid, content);
  }

  /**
   * Configura event handlers para uma sessão
   */
  private setupEventHandlers(
    sessionId: string,
    socket: WASocket,
    saveCreds: () => Promise<void>,
  ): void {
    // Event: connection.update
    socket.ev.on('connection.update', (update: Partial<ConnectionState>) => {
      void this.handleConnectionUpdate(sessionId, update);
    });

    // Event: creds.update - CRÍTICO: sempre salvar credenciais
    socket.ev.on('creds.update', () => {
      void saveCreds();
      this.logger.debug(`Credenciais atualizadas para sessão ${sessionId}`);
    });

    // Event: messages.upsert
    socket.ev.on('messages.upsert', (payload) => {
      this.logger.debug(
        `Mensagem recebida na sessão ${sessionId}`,
        payload.messages[0]?.key,
      );
      // TODO: Delegar para MessageService
    });
  }

  /**
   * Trata atualizações de conexão
   */
  private async handleConnectionUpdate(
    sessionId: string,
    update: Partial<ConnectionState>,
  ): Promise<void> {
    const instance = this.sessions.get(sessionId);
    if (!instance) return;

    this.logger.info(`Atualização de conexão para ${sessionId}`, update);

    // QR Code recebido
    if (update.qr) {
      instance.qrCode = update.qr;
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          qrCode: update.qr,
          status: SessionStatus.connecting,
        },
      });
    }

    // Conexão aberta
    if (update.connection === 'open') {
      instance.status = SessionStatus.connected;
      instance.qrCode = undefined;

      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.connected,
          qrCode: null,
          lastConnected: new Date(),
        },
      });

      this.logger.info(`Sessão ${sessionId} conectada com sucesso`);
    }

    // Conexão fechada
    if (update.connection === 'close') {
      const error = update.lastDisconnect?.error as
        | { output?: { statusCode?: number } }
        | undefined;
      const shouldReconnect =
        error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        this.logger.info(`Reconectando sessão ${sessionId}...`);
        await this.disconnectSession(sessionId);
        // Aguardar 3 segundos antes de reconectar
        setTimeout(() => {
          void this.connectSession(sessionId);
        }, 3000);
      } else {
        this.logger.warn(
          `Sessão ${sessionId} foi deslogada - não reconectando`,
        );
        await this.disconnectSession(sessionId);
      }
    }
  }

  /**
   * Obtém todas as sessões ativas
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Verifica se uma sessão está conectada
   */
  isSessionConnected(sessionId: string): boolean {
    const instance = this.sessions.get(sessionId);
    return instance?.status === SessionStatus.connected;
  }
}
