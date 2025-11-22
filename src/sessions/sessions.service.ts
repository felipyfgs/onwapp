import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { PairPhoneDto } from './dto/pair-phone.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppService,
  ) {}

  async createSession(
    createSessionDto: CreateSessionDto,
  ): Promise<SessionResponseDto> {
    const session = await this.prisma.session.create({
      data: {
        name: createSessionDto.name,
        status: 'disconnected',
      },
    });

    return this.mapToResponseDto(session);
  }

  async getSessions(): Promise<SessionResponseDto[]> {
    const sessions = await this.prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => this.mapToResponseDto(session));
  }

  async getSession(id: string): Promise<SessionResponseDto> {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return this.mapToResponseDto(session);
  }

  async deleteSession(id: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    await this.whatsapp.deleteSession(session.id);

    await this.prisma.session.delete({
      where: { id },
    });
  }

  async connectSession(id: string): Promise<SessionResponseDto> {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    if (session.status === 'connected') {
      throw new BadRequestException('Session is already connected');
    }

    await this.whatsapp.createSocket(session.sessionId);

    const updatedSession = await this.prisma.session.findUnique({
      where: { id },
    });

    return this.mapToResponseDto(updatedSession!);
  }

  async disconnectSession(id: string): Promise<SessionResponseDto> {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    await this.whatsapp.disconnectSocket(session.sessionId);

    const updatedSession = await this.prisma.session.update({
      where: { id },
      data: { status: 'disconnected', qrCode: null },
    });

    return this.mapToResponseDto(updatedSession);
  }

  async logoutSession(id: string): Promise<SessionResponseDto> {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    await this.whatsapp.disconnectSocket(session.sessionId);

    const updatedSession = await this.prisma.session.update({
      where: { id },
      data: { status: 'disconnected', qrCode: null },
    });

    return this.mapToResponseDto(updatedSession);
  }

  async getQRCode(id: string): Promise<{ qrCode?: string }> {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    const qrCode =
      this.whatsapp.getQRCode(session.sessionId) || session.qrCode || undefined;

    return { qrCode };
  }

  async pairPhone(
    id: string,
    pairPhoneDto: PairPhoneDto,
  ): Promise<SessionResponseDto> {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    const socket = this.whatsapp.getSocket(session.sessionId);

    if (!socket) {
      throw new BadRequestException(
        'Session is not connected. Please connect first.',
      );
    }

    await socket.requestPairingCode(pairPhoneDto.phoneNumber);

    const updatedSession = await this.prisma.session.update({
      where: { id },
      data: { phoneNumber: pairPhoneDto.phoneNumber },
    });

    return this.mapToResponseDto(updatedSession);
  }

  async getSessionStatus(id: string): Promise<{ status: string }> {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return { status: session.status };
  }

  private mapToResponseDto(session: any): SessionResponseDto {
    return {
      id: session.id,
      name: session.name,
      sessionId: session.sessionId,
      status: session.status,
      qrCode: session.qrCode ?? undefined,
      phoneNumber: session.phoneNumber ?? undefined,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
