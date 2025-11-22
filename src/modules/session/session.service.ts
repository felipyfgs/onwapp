import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsManagerService } from '../../whats/whats-manager.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { PairPhoneDto } from './dto/pair-phone.dto';
import {
  SessionResponseDto,
  SessionStatusResponseDto,
  QRCodeResponseDto,
  WebhookEventsResponseDto,
} from './dto/session-response.dto';
import { Session, SessionStatus } from '@prisma/client';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsManager: WhatsManagerService,
  ) {}

  /**
   * Lista todos os eventos de webhook disponíveis
   */
  listWebhookEvents(): WebhookEventsResponseDto {
    return {
      events: [
        'connection.update',
        'creds.update',
        'messages.upsert',
        'messages.update',
        'messages.delete',
        'message-receipt.update',
        'presence.update',
        'chats.upsert',
        'chats.update',
        'chats.delete',
        'contacts.upsert',
        'contacts.update',
        'groups.upsert',
        'groups.update',
        'group-participants.update',
      ],
    };
  }

  /**
   * Cria uma nova sessão
   */
  async createSession(dto: CreateSessionDto): Promise<SessionResponseDto> {
    const session = await this.prisma.session.create({
      data: {
        name: dto.name,
        webhookUrl: dto.webhookUrl,
        status: SessionStatus.disconnected,
      },
    });

    return this.toResponseDto(session);
  }

  /**
   * Lista todas as sessões
   */
  async getSessions(): Promise<SessionResponseDto[]> {
    const sessions = await this.prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => this.toResponseDto(session));
  }

  /**
   * Obtém detalhes de uma sessão específica
   */
  async getSession(id: string): Promise<SessionResponseDto> {
    const session = await this.findSessionOrThrow(id);
    return this.toResponseDto(session);
  }

  /**
   * Deleta uma sessão
   */
  async deleteSession(id: string): Promise<void> {
    await this.findSessionOrThrow(id);

    // Desconectar se estiver conectada
    if (this.whatsManager.isSessionConnected(id)) {
      await this.whatsManager.disconnectSession(id);
    }

    // Deletar do banco (cascade deleta authState também)
    await this.prisma.session.delete({
      where: { id },
    });
  }

  /**
   * Conecta uma sessão ao WhatsApp
   */
  async connectSession(id: string): Promise<SessionResponseDto> {
    await this.findSessionOrThrow(id);

    // Conectar via WhatsManagerService
    await this.whatsManager.connectSession(id);

    // Buscar sessão atualizada
    const updatedSession = await this.prisma.session.findUnique({
      where: { id },
    });

    return this.toResponseDto(updatedSession!);
  }

  /**
   * Desconecta uma sessão do WhatsApp
   */
  async disconnectSession(id: string): Promise<SessionResponseDto> {
    await this.findSessionOrThrow(id);

    // Desconectar via WhatsManagerService
    await this.whatsManager.disconnectSession(id);

    // Buscar sessão atualizada
    const updatedSession = await this.prisma.session.findUnique({
      where: { id },
    });

    return this.toResponseDto(updatedSession!);
  }

  /**
   * Obtém o QR Code de uma sessão
   */
  async getQRCode(id: string): Promise<QRCodeResponseDto> {
    await this.findSessionOrThrow(id);

    // Tentar obter QR da sessão ativa primeiro
    const qrCode = this.whatsManager.getQRCode(id);

    if (qrCode) {
      return { qrCode };
    }

    // Se não houver na memória, buscar do banco
    const session = await this.prisma.session.findUnique({
      where: { id },
      select: { qrCode: true },
    });

    return { qrCode: session?.qrCode || null };
  }

  /**
   * Parear sessão com número de telefone
   */
  async pairPhone(id: string, dto: PairPhoneDto): Promise<SessionResponseDto> {
    await this.findSessionOrThrow(id);

    // TODO: Implementar lógica de pairing com telefone usando whaileys
    // Por enquanto apenas atualiza o número no banco
    const updatedSession = await this.prisma.session.update({
      where: { id },
      data: { phone: dto.phoneNumber },
    });

    return this.toResponseDto(updatedSession);
  }

  /**
   * Obtém o status atual de uma sessão
   */
  async getSessionStatus(id: string): Promise<SessionStatusResponseDto> {
    await this.findSessionOrThrow(id);

    const status = this.whatsManager.getSessionStatus(id);
    const isConnected = this.whatsManager.isSessionConnected(id);

    return {
      id,
      status,
      isConnected,
    };
  }

  /**
   * Helper: Busca sessão ou lança exceção
   */
  private async findSessionOrThrow(id: string): Promise<Session> {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Sess

ão com ID ${id} não encontrada`);
    }

    return session;
  }

  /**
   * Helper: Converte Session para ResponseDto
   */
  private toResponseDto(session: Session): SessionResponseDto {
    return {
      id: session.id,
      name: session.name,
      phone: session.phone,
      status: session.status,
      qrCode: session.qrCode,
      webhookUrl: session.webhookUrl,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      lastConnected: session.lastConnected,
    };
  }
}
