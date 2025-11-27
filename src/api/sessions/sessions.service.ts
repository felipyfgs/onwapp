import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WhaileysService } from '../../core/whaileys/whaileys.service';
import {
  SessionResponseDto,
  SessionStatusResponseDto,
  SessionConnectResponseDto,
  SessionInfoResponseDto,
  PairingCodeResponseDto,
} from './dto';

@Injectable()
export class SessionsService {
  constructor(private readonly whaileysService: WhaileysService) {}

  async create(name: string): Promise<SessionResponseDto> {
    return this.whaileysService.createSession(name);
  }

  async findAll(): Promise<SessionResponseDto[]> {
    return this.whaileysService.getAllSessions();
  }

  async connect(name: string): Promise<SessionConnectResponseDto> {
    try {
      return await this.whaileysService.connectSession(name);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(`Session '${name}' not found`);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to connect session',
      );
    }
  }

  async getQr(name: string): Promise<string | null> {
    return this.whaileysService.getQr(name);
  }

  async getStatus(name: string): Promise<SessionStatusResponseDto> {
    try {
      return await this.whaileysService.getStatus(name);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(`Session '${name}' not found`);
      }
      throw error;
    }
  }

  async logout(name: string): Promise<void> {
    try {
      await this.whaileysService.logoutSession(name);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(`Session '${name}' not found`);
      }
      throw error;
    }
  }

  async restart(name: string): Promise<SessionConnectResponseDto> {
    try {
      return await this.whaileysService.restartSession(name);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(`Session '${name}' not found`);
      }
      throw error;
    }
  }

  async remove(name: string): Promise<void> {
    await this.whaileysService.deleteSession(name);
  }

  async getInfo(name: string): Promise<SessionInfoResponseDto> {
    try {
      return await this.whaileysService.getSessionInfo(name);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(`Session '${name}' not found`);
      }
      throw error;
    }
  }

  async requestPairingCode(
    name: string,
    phoneNumber: string,
    customCode?: string,
  ): Promise<PairingCodeResponseDto> {
    try {
      const code = await this.whaileysService.requestPairingCode(
        name,
        phoneNumber,
        customCode,
      );
      return { code };
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(`Session '${name}' not found`);
      }
      if (error instanceof Error && error.message.includes('not initialized')) {
        throw new BadRequestException(
          'Session not initialized. Call /connect first.',
        );
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to request pairing code',
      );
    }
  }
}
