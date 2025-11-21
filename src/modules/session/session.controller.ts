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
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiSecurity,
    ApiParam
} from '@nestjs/swagger';
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

@ApiTags('Sessions')
@ApiSecurity('X-API-Key')
@Controller('sessions')
@UseGuards(ApiKeyGuard)
export class SessionController {
    constructor(private readonly sessionService: SessionService) { }

    /**
     * GET /sessions/webhook/events
     * List all available webhook events
     */
    @Get('webhook/events')
    @ApiOperation({ summary: 'List available webhook events' })
    @ApiResponse({ status: 200, description: 'List of events', type: WebhookEventsDto })
    listWebhookEvents(): WebhookEventsDto {
        return this.sessionService.listWebhookEvents();
    }

    /**
     * POST /sessions/create
     * Create a new session
     */
    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new session' })
    @ApiResponse({ status: 201, description: 'Session created successfully', type: SessionResponseDto })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    async createSession(@Body(ValidationPipe) createSessionDto: CreateSessionDto): Promise<SessionResponseDto> {
        return this.sessionService.createSession(createSessionDto);
    }

    /**
     * GET /sessions/list
     * List all sessions
     */
    @Get('list')
    @ApiOperation({ summary: 'List all sessions' })
    @ApiResponse({ status: 200, description: 'List of sessions', type: [SessionResponseDto] })
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
    @ApiOperation({ summary: 'Get session details' })
    @ApiParam({ name: 'id', description: 'Session ID' })
    @ApiResponse({ status: 200, description: 'Session details', type: SessionResponseDto })
    @ApiResponse({ status: 404, description: 'Session not found' })
    async getSession(@Param('id') id: string): Promise<SessionResponseDto> {
        return this.sessionService.findOne(id);
    }

    /**
     * DELETE /sessions/:id/delete
     * Delete a session
     */
    @Delete(':id/delete')
    @ApiOperation({ summary: 'Delete a session' })
    @ApiParam({ name: 'id', description: 'Session ID' })
    @ApiResponse({ status: 200, description: 'Session deleted', type: MessageResponseDto })
    @ApiResponse({ status: 404, description: 'Session not found' })
    async deleteSession(@Param('id') id: string): Promise<MessageResponseDto> {
        return this.sessionService.deleteSession(id);
    }

    /**
     * POST /sessions/:id/connect
     * Connect a session to WhatsApp
     */
    @Post(':id/connect')
    @ApiOperation({ summary: 'Connect session to WhatsApp' })
    @ApiParam({ name: 'id', description: 'Session ID' })
    @ApiResponse({ status: 201, description: 'Connection initiated', type: MessageResponseDto })
    @ApiResponse({ status: 400, description: 'Session already connected' })
    @ApiResponse({ status: 404, description: 'Session not found' })
    async connectSession(@Param('id') id: string): Promise<MessageResponseDto> {
        return this.sessionService.connectSession(id);
    }

    /**
     * POST /sessions/:id/disconnect
     * Disconnect a session from WhatsApp
     */
    @Post(':id/disconnect')
    @ApiOperation({ summary: 'Disconnect session from WhatsApp' })
    @ApiParam({ name: 'id', description: 'Session ID' })
    @ApiResponse({ status: 201, description: 'Session disconnected', type: MessageResponseDto })
    @ApiResponse({ status: 400, description: 'Session not connected' })
    @ApiResponse({ status: 404, description: 'Session not found' })
    async disconnectSession(@Param('id') id: string): Promise<MessageResponseDto> {
        return this.sessionService.disconnectSession(id);
    }

    /**
     * GET /sessions/:id/qr
     * Get QR code for session
     */
    @Get(':id/qr')
    @ApiOperation({ summary: 'Get QR code for session' })
    @ApiParam({ name: 'id', description: 'Session ID' })
    @ApiResponse({ status: 200, description: 'QR Code data', type: QRCodeResponseDto })
    @ApiResponse({ status: 404, description: 'Session not found' })
    async getQRCode(@Param('id') id: string): Promise<QRCodeResponseDto> {
        return this.sessionService.getQRCode(id);
    }

    /**
     * POST /sessions/:id/pair
     * Pair session with phone number
     */
    @Post(':id/pair')
    @ApiOperation({ summary: 'Pair session with phone number' })
    @ApiParam({ name: 'id', description: 'Session ID' })
    @ApiResponse({ status: 201, description: 'Pairing initiated', type: MessageResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid phone number or session not connected' })
    @ApiResponse({ status: 404, description: 'Session not found' })
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
    @ApiOperation({ summary: 'Get session connection status' })
    @ApiParam({ name: 'id', description: 'Session ID' })
    @ApiResponse({ status: 200, description: 'Session status', type: SessionStatusDto })
    @ApiResponse({ status: 404, description: 'Session not found' })
    async getSessionStatus(@Param('id') id: string): Promise<SessionStatusDto> {
        return this.sessionService.getSessionStatus(id);
    }

    /**
     * POST /sessions/:id/logout
     * Logout session and clear credentials
     */
    @Post(':id/logout')
    @ApiOperation({ summary: 'Logout session and clear credentials' })
    @ApiParam({ name: 'id', description: 'Session ID' })
    @ApiResponse({ status: 201, description: 'Session logged out', type: MessageResponseDto })
    @ApiResponse({ status: 404, description: 'Session not found' })
    async logoutSession(@Param('id') id: string): Promise<MessageResponseDto> {
        return this.sessionService.logoutSession(id);
    }
}
