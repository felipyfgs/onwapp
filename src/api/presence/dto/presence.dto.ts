import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export type PresenceStatus =
  | 'online'
  | 'offline'
  | 'typing'
  | 'recording'
  | 'paused';

export class SetPresenceDto {
  @ApiProperty({
    enum: ['online', 'offline', 'typing', 'recording', 'paused'],
    description:
      'Presence status. Use online/offline for global, typing/recording/paused for chat-specific',
  })
  @IsEnum(['online', 'offline', 'typing', 'recording', 'paused'])
  presence: PresenceStatus;

  @ApiPropertyOptional({
    example: '5511999999999@s.whatsapp.net',
    description: 'Chat ID (required for typing/recording/paused)',
  })
  @IsString()
  @IsOptional()
  chatId?: string;
}

export class ParticipantPresenceDto {
  @ApiProperty({ example: '5511999999999@s.whatsapp.net' })
  participant: string;

  @ApiProperty({
    enum: ['online', 'offline', 'typing', 'recording', 'paused'],
  })
  lastKnownPresence: PresenceStatus;

  @ApiPropertyOptional({ example: 1686719326 })
  lastSeen: number | null;
}

export class ChatPresenceResponseDto {
  @ApiProperty({ example: '5511999999999@s.whatsapp.net' })
  id: string;

  @ApiProperty({ type: [ParticipantPresenceDto] })
  presences: ParticipantPresenceDto[];
}

export { SuccessResponseDto } from '../../../common/dto';
