import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';

export { SuccessResponseDto } from '../../../common/dto';

export class SessionResponseDto {
  @ApiProperty({ example: 'cm1234567890', description: 'Session ID' })
  id: string;

  @ApiProperty({ example: 'my-session', description: 'Session name' })
  name: string;

  @ApiProperty({
    enum: SessionStatus,
    example: 'connected',
    description: 'Session connection status',
  })
  status: SessionStatus;

  @ApiPropertyOptional({
    example: '5511999999999',
    description: 'Connected phone number',
  })
  phone?: string | null;

  @ApiPropertyOptional({
    example: 'base64...',
    description: 'QR code for authentication',
  })
  qrcode?: string | null;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}

export class SessionStatusResponseDto {
  @ApiProperty({
    enum: SessionStatus,
    example: 'connected',
    description: 'Session connection status',
  })
  status: SessionStatus;

  @ApiPropertyOptional({
    example: '5511999999999',
    description: 'Connected phone number',
  })
  phone?: string;
}

export class SessionQrResponseDto {
  @ApiProperty({
    example: 'base64...',
    description: 'QR code string for authentication',
  })
  qr: string;
}

export class SessionConnectResponseDto {
  @ApiProperty({
    enum: SessionStatus,
    example: 'connecting',
    description: 'Session connection status',
  })
  status: SessionStatus;

  @ApiPropertyOptional({
    example: 'base64...',
    description: 'QR code if available',
  })
  qrcode?: string;
}

export class SessionInfoResponseDto {
  @ApiProperty({ example: 'my-session', description: 'Session name' })
  name: string;

  @ApiProperty({
    enum: SessionStatus,
    example: 'connected',
    description: 'Session connection status',
  })
  status: SessionStatus;

  @ApiPropertyOptional({
    example: '5511999999999',
    description: 'Connected phone number',
  })
  phone?: string;

  @ApiPropertyOptional({ description: 'WhatsApp user info' })
  user?: unknown;
}
