import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import {
  CreateSessionDto,
  SessionResponseDto,
  SessionStatusResponseDto,
  SessionQrResponseDto,
  SessionConnectResponseDto,
  SessionInfoResponseDto,
  SuccessResponseDto,
} from './dto';

@ApiTags('Sessions')
@ApiSecurity('apikey')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all sessions' })
  @ApiResponse({
    status: 200,
    description: 'List of all sessions',
    type: [SessionResponseDto],
  })
  async findAll(): Promise<SessionResponseDto[]> {
    return this.sessionsService.findAll();
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new session' })
  @ApiResponse({
    status: 201,
    description: 'Session created',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid session name' })
  async create(@Body() dto: CreateSessionDto): Promise<SessionResponseDto> {
    return this.sessionsService.create(dto.name);
  }

  @Post(':name/connect')
  @ApiOperation({ summary: 'Connect/start a session' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Connection initiated',
    type: SessionConnectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async connect(
    @Param('name') name: string,
  ): Promise<SessionConnectResponseDto> {
    return this.sessionsService.connect(name);
  }

  @Get(':name/qr')
  @ApiOperation({ summary: 'Get QR code for session authentication' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'QR code returned',
    type: SessionQrResponseDto,
  })
  @ApiResponse({ status: 404, description: 'QR not available' })
  async getQr(@Param('name') name: string): Promise<SessionQrResponseDto> {
    const qr = await this.sessionsService.getQr(name);
    if (!qr) {
      throw new HttpException('QR not available', HttpStatus.NOT_FOUND);
    }
    return { qr };
  }

  @Get(':name/status')
  @ApiOperation({ summary: 'Get session connection status' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Session status',
    type: SessionStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getStatus(
    @Param('name') name: string,
  ): Promise<SessionStatusResponseDto> {
    return this.sessionsService.getStatus(name);
  }

  @Post(':name/logout')
  @ApiOperation({ summary: 'Logout from WhatsApp (clears credentials)' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async logout(@Param('name') name: string): Promise<SuccessResponseDto> {
    await this.sessionsService.logout(name);
    return { success: true };
  }

  @Post(':name/restart')
  @ApiOperation({
    summary: 'Restart session (clears credentials and reconnects)',
  })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Session restarted',
    type: SessionConnectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async restart(
    @Param('name') name: string,
  ): Promise<SessionConnectResponseDto> {
    return this.sessionsService.restart(name);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a session' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Session deleted',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async remove(@Param('name') name: string): Promise<SuccessResponseDto> {
    await this.sessionsService.remove(name);
    return { success: true };
  }

  @Get(':name/info')
  @ApiOperation({ summary: 'Get detailed session info' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Session info',
    type: SessionInfoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getInfo(@Param('name') name: string): Promise<SessionInfoResponseDto> {
    return this.sessionsService.getInfo(name);
  }
}
