import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    ValidationPipe,
    UseGuards,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { SessionService } from './session.service';
import {
    CreateSessionDto,
    PairPhoneDto,
    SessionResponseDto,
    SessionStatusDto,
    QRCodeResponseDto,
    WebhookEventsDto,
    MessageResponseDto
} from './dto';
import { ApiKeyGuard } from '@/guards/api-key.guard';

@Controller('sessions')
@UseGuards(ApiKeyGuard)
export class SessionController {
    constructor(private readonly sessionService: SessionService) { }

    /**
     * GET /sessions/webhook/events
     * List all available webhook events
     */
    @Get('webhook/events')
    listWebhookEvents(): WebhookEventsDto {
        return this.sessionService.listWebhookEvents();
    }

    /**
     * POST /sessions/create
     * Create a new session
     */
    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    async createSession(@Body(ValidationPipe) createSessionDto: CreateSessionDto): Promise<SessionResponseDto> {
        return this.sessionService.createSession(createSessionDto);
    }

    /**
     * GET /sessions/list
     * List all sessions
     */
    @Get('list')
    async getSessions(): Promise<SessionResponseDto[]> {
        const sessions = await this.sessionService.findAll();
        return sessions.map(session => ({
            ...session,
            phoneNumber: session.phoneNumber ?? undefined,
            webhookUrl: session.webhookUrl ?? undefined
        }));
    }

    /**
     * GET /sessions/:id/info
     * Get session details
     */
    @Get(':id/info')
    async getSession(@Param('id') id: string): Promise<SessionResponseDto> {
        return this.sessionService.findOne(id);
    }

    /**
     * DELETE /sessions/:id/delete
     * Delete a session
     */
    @Delete(':id/delete')
    async deleteSession(@Param('id') id: string): Promise<MessageResponseDto> {
        return this.sessionService.deleteSession(id);
    }

    /**
     * POST /sessions/:id/connect
     * Connect a session to WhatsApp
     */
    @Post(':id/connect')
    async connectSession(@Param('id') id: string): Promise<MessageResponseDto> {
        return this.sessionService.connectSession(id);
    }

    /**
     * POST /sessions/:id/disconnect
     * Disconnect a session from WhatsApp
     */
    @Post(':id/disconnect')
    async disconnectSession(@Param('id') id: string): Promise<MessageResponseDto> {
        return this.sessionService.disconnectSession(id);
    }

    /**
     * GET /sessions/:id/qr
     * Get QR code for session
     */
    @Get(':id/qr')
    async getQRCode(@Param('id') id: string): Promise<QRCodeResponseDto> {
        return this.sessionService.getQRCode(id);
    }

    /**
     * POST /sessions/:id/pair
     * Pair session with phone number
     */
    @Post(':id/pair')
    async pairPhone(
        @Param('id') id: string,
        @Body(ValidationPipe) pairPhoneDto: PairPhoneDto
    ): Promise<MessageResponseDto> {
        return this.sessionService.pairPhone(id, pairPhoneDto);
    }

    /**
     * GET /sessions/:id/status
     * Get session connection status
     */
    @Get(':id/status')
    async getSessionStatus(@Param('id') id: string): Promise<SessionStatusDto> {
        return this.sessionService.getSessionStatus(id);
    }

    /**
     * POST /sessions/:id/logout
     * Logout session and clear credentials
     */
    @Post(':id/logout')
    async logoutSession(@Param('id') id: string): Promise<MessageResponseDto> {
        return this.sessionService.logoutSession(id);
    }
}
