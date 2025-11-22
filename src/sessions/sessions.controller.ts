import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { PairPhoneDto } from './dto/pair-phone.dto';
import { SessionResponseDto } from './dto/session-response.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
  ): Promise<SessionResponseDto> {
    return this.sessionsService.createSession(createSessionDto);
  }

  @Get()
  async getSessions(): Promise<SessionResponseDto[]> {
    return this.sessionsService.getSessions();
  }

  @Get(':id')
  async getSession(@Param('id') id: string): Promise<SessionResponseDto> {
    return this.sessionsService.getSession(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSession(@Param('id') id: string): Promise<void> {
    return this.sessionsService.deleteSession(id);
  }

  @Post(':id/connect')
  async connectSession(@Param('id') id: string): Promise<SessionResponseDto> {
    return this.sessionsService.connectSession(id);
  }

  @Post(':id/disconnect')
  async disconnectSession(
    @Param('id') id: string,
  ): Promise<SessionResponseDto> {
    return this.sessionsService.disconnectSession(id);
  }

  @Get(':id/qr')
  async getQRCode(@Param('id') id: string): Promise<{ qrCode?: string }> {
    return this.sessionsService.getQRCode(id);
  }

  @Post(':id/pair')
  async pairPhone(
    @Param('id') id: string,
    @Body() pairPhoneDto: PairPhoneDto,
  ): Promise<SessionResponseDto> {
    return this.sessionsService.pairPhone(id, pairPhoneDto);
  }

  @Get(':id/status')
  async getSessionStatus(@Param('id') id: string): Promise<{ status: string }> {
    return this.sessionsService.getSessionStatus(id);
  }
}
