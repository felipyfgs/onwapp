import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionResponseDto {
    @ApiProperty({ description: 'Session ID (UUID)' })
    id: string;

    @ApiProperty({ description: 'Session name' })
    name: string;

    @ApiProperty({ description: 'Connection status', example: 'disconnected' })
    status: string;

    @ApiPropertyOptional({ description: 'QR Code string (if available)', nullable: true })
    qrCode?: string | null;

    @ApiPropertyOptional({ description: 'Connected phone number', nullable: true })
    phoneNumber?: string | null;

    @ApiPropertyOptional({ description: 'Webhook URL', nullable: true })
    webhookUrl?: string | null;

    @ApiProperty({ description: 'Subscribed webhook events', type: [String] })
    webhookEvents: string[];

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update timestamp' })
    updatedAt: Date;
}

export class SessionStatusDto {
    @ApiProperty({ description: 'Session ID' })
    id: string;

    @ApiProperty({ description: 'Session name' })
    name: string;

    @ApiProperty({ description: 'Connection status' })
    status: string;

    @ApiPropertyOptional({ description: 'Connected phone number', nullable: true })
    phoneNumber?: string | null;
}

export class QRCodeResponseDto {
    @ApiProperty({ description: 'Session ID' })
    id: string;

    @ApiPropertyOptional({ description: 'QR Code string', nullable: true })
    qrCode?: string | null;

    @ApiProperty({ description: 'Connection status' })
    status: string;

    @ApiPropertyOptional({ description: 'Status message' })
    message?: string;
}

export class WebhookEventsDto {
    @ApiProperty({ description: 'List of available webhook events', type: [String] })
    events: string[];
}

export class MessageResponseDto {
    @ApiProperty({ description: 'Response message' })
    message: string;
}
