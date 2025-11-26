import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  SessionRepository,
  SessionWithConfigs,
} from '../../database/repositories/session.repository';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { DatabaseService } from '../../database/database.service';
import { ChatwootConfigService } from '../../integrations/chatwoot/services/chatwoot-config.service';
import { ChatwootBotService } from '../../integrations/chatwoot/services/chatwoot-bot.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { PairPhoneDto } from './dto/pair-phone.dto';
import { SessionResponseDto } from './dto/session-response.dto';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly prisma: DatabaseService,
    private whatsapp: WhatsAppService,
    private readonly chatwootConfigService: ChatwootConfigService,
    private readonly chatwootBotService: ChatwootBotService,
  ) {}

  async createSession(
    createSessionDto: CreateSessionDto,
  ): Promise<SessionResponseDto> {
    const { name, webhook, chatwoot, proxy } = createSessionDto;
    const autoCreate = chatwoot?.autoCreate ?? false;

    // Create session with all configs in a transaction
    const session = await this.prisma.$transaction(async (tx) => {
      // Create the session
      const newSession = await tx.session.create({
        data: {
          name,
          status: 'disconnected',
        },
      });

      // Create webhook config if provided
      if (webhook?.url) {
        await tx.webhook.create({
          data: {
            sessionId: newSession.id,
            enabled: webhook.enabled ?? true,
            url: webhook.url,
            events: webhook.events ?? [],
          },
        });
      }

      // Chatwoot config will be created after transaction via ChatwootConfigService
      // to ensure inbox is auto-created in Chatwoot

      // Create proxy config if provided
      if (proxy) {
        await tx.proxy.create({
          data: {
            sessionId: newSession.id,
            enabled: proxy.enabled ?? false,
            host: proxy.host,
            port: proxy.port,
            protocol: proxy.protocol ?? 'http',
            username: proxy.username,
            password: proxy.password,
          },
        });
      }

      return newSession.id;
    });

    // Create Chatwoot config via ChatwootConfigService (auto-creates inbox)
    if (chatwoot && chatwoot.enabled) {
      try {
        await this.chatwootConfigService.upsertConfig(session, {
          enabled: chatwoot.enabled,
          accountId: chatwoot.accountId,
          token: chatwoot.token,
          url: chatwoot.url,
          inbox: chatwoot.inbox || name, // Use session name as default inbox name
          signMsg: chatwoot.signMsg,
          signDelimiter: chatwoot.signDelimiter,
          reopen: chatwoot.reopen,
          pending: chatwoot.pending,
          mergeBrazil: chatwoot.mergeBrazil,
          importContacts: chatwoot.importContacts,
          importMessages: chatwoot.importMessages,
          importDays: chatwoot.importDays,
          ignoreJids: chatwoot.ignoreJids,
          organization: chatwoot.organization,
          logo: chatwoot.logo,
        });
        this.logger.log(`Chatwoot configured for session: ${session}`);

        // Initialize bot contact with welcome message
        const welcomeMessage = autoCreate
          ? '🤖 *Zpwoot Bot*\n\nSessão criada! Aguarde o QR Code...\n\n_Comandos: /init, /status, /disconnect, /help_'
          : '🤖 *Zpwoot Bot*\n\nSessão criada! Envie `/init` para conectar.\n\n_Comandos: /init, /status, /disconnect, /help_';

        await this.chatwootBotService.sendBotMessage(session, welcomeMessage);
        this.logger.log(`Bot initialized for session: ${session}`);
      } catch (error) {
        this.logger.error(
          `Failed to configure Chatwoot for session ${session}: ${(error as Error).message}`,
        );
      }
    }

    // Auto-connect if autoCreate is true (generates QR code and sends to Chatwoot bot)
    if (autoCreate) {
      try {
        const sessionWithProxy =
          await this.sessionRepository.findByIdWithConfigs(session);
        await this.whatsapp.createSocket(
          session,
          sessionWithProxy?.proxy ?? undefined,
        );
        this.logger.log(`Auto-connecting session: ${session}`);
      } catch (error) {
        this.logger.error(
          `Failed to auto-connect session ${session}: ${(error as Error).message}`,
        );
      }
    }

    // Fetch the complete session with configs
    const fullSession =
      await this.sessionRepository.findByIdWithConfigs(session);

    this.logger.log(`Session created: ${fullSession!.id} (${name})`);

    return this.mapToResponseDto(fullSession!);
  }

  async getSessions(): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepository.findAllWithConfigs();
    return sessions.map((session) => this.mapToResponseDto(session));
  }

  async getSession(id: string): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findByIdWithConfigs(id);

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return this.mapToResponseDto(session);
  }

  async deleteSession(id: string): Promise<void> {
    const session = await this.sessionRepository.findById(id);

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    await this.whatsapp.deleteSession(session.id);
    await this.sessionRepository.delete(id);

    this.logger.log(`Session deleted: ${id}`);
  }

  async connectSession(id: string): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findByIdWithConfigs(id);

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    if (session.status === 'connected') {
      throw new BadRequestException('Session is already connected');
    }

    // Pass proxy config to WhatsApp service if enabled
    await this.whatsapp.createSocket(session.id, session.proxy ?? undefined);

    const updatedSession = await this.sessionRepository.findByIdWithConfigs(id);
    return this.mapToResponseDto(updatedSession!);
  }

  async disconnectSession(id: string): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findById(id);

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    await this.whatsapp.disconnectSocket(session.id);

    const updatedSession = await this.sessionRepository.updateWithConfigs(id, {
      status: 'disconnected',
      qrCode: null,
    });

    return this.mapToResponseDto(updatedSession);
  }

  async logoutSession(id: string): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findById(id);

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    await this.whatsapp.disconnectSocket(session.id);

    const updatedSession = await this.sessionRepository.updateWithConfigs(id, {
      status: 'disconnected',
      qrCode: null,
    });

    return this.mapToResponseDto(updatedSession);
  }

  async getQRCode(id: string): Promise<{ qrCode?: string }> {
    const session = await this.sessionRepository.findById(id);

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    const qrCode =
      this.whatsapp.getQRCode(session.id) || session.qrCode || undefined;

    return { qrCode };
  }

  async pairPhone(
    id: string,
    pairPhoneDto: PairPhoneDto,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findByIdWithConfigs(id);

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    const socket = this.whatsapp.getSocket(session.id);

    if (!socket) {
      throw new BadRequestException(
        'Session is not connected. Please connect first.',
      );
    }

    await socket.requestPairingCode(pairPhoneDto.phoneNumber);

    const updatedSession = await this.sessionRepository.updateWithConfigs(id, {
      phone: pairPhoneDto.phoneNumber,
    });

    return this.mapToResponseDto(updatedSession);
  }

  async getSessionStatus(id: string): Promise<{ status: string }> {
    const session = await this.sessionRepository.findById(id);

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return { status: session.status };
  }

  private mapToResponseDto(session: SessionWithConfigs): SessionResponseDto {
    return {
      id: session.id,
      name: session.name,
      status: session.status,
      qrCode: session.qrCode ?? undefined,
      phone: session.phone ?? undefined,
      webhook: session.webhook
        ? {
            id: session.webhook.id,
            sessionId: session.webhook.sessionId,
            enabled: session.webhook.enabled,
            url: session.webhook.url,
            events: session.webhook.events,
            createdAt: session.webhook.createdAt,
            updatedAt: session.webhook.updatedAt,
          }
        : undefined,
      chatwoot: session.chatwoot
        ? {
            id: session.chatwoot.id,
            sessionId: session.chatwoot.sessionId,
            enabled: session.chatwoot.enabled,
            accountId: session.chatwoot.accountId ?? undefined,
            url: session.chatwoot.url ?? undefined,
            inbox: session.chatwoot.inbox ?? undefined,
            signMsg: session.chatwoot.signMsg,
            reopen: session.chatwoot.reopen,
            pending: session.chatwoot.pending,
            createdAt: session.chatwoot.createdAt,
            updatedAt: session.chatwoot.updatedAt,
          }
        : undefined,
      proxy: session.proxy
        ? {
            id: session.proxy.id,
            sessionId: session.proxy.sessionId,
            enabled: session.proxy.enabled,
            host: session.proxy.host ?? undefined,
            port: session.proxy.port ?? undefined,
            protocol: session.proxy.protocol ?? undefined,
            username: session.proxy.username ?? undefined,
            createdAt: session.proxy.createdAt,
            updatedAt: session.proxy.updatedAt,
          }
        : undefined,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
