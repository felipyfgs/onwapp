import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  IsOptional,
  IsUrl,
  ArrayMinSize,
} from 'class-validator';

export const WEBHOOK_EVENTS = [
  'messages.upsert',
  'messages.update',
  'messages.reaction',
  'message-receipt.update',
  'chats.upsert',
  'chats.update',
  'chats.delete',
  'contacts.upsert',
  'contacts.update',
  'groups.upsert',
  'groups.update',
  'group-participants.update',
  'presence.update',
  'connection.update',
  'call',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export class CreateWebhookDto {
  @ApiProperty({
    example: 'https://example.com/webhook',
    description: 'Webhook URL',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    example: ['messages.upsert', 'messages.update'],
    description: 'Events to listen to',
    enum: WEBHOOK_EVENTS,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  events: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Enable webhook',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class UpdateWebhookDto {
  @ApiPropertyOptional({
    example: 'https://example.com/webhook',
    description: 'Webhook URL',
  })
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({
    example: ['messages.upsert'],
    description: 'Events to listen to',
    enum: WEBHOOK_EVENTS,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  events?: string[];

  @ApiPropertyOptional({ example: true, description: 'Enable/disable webhook' })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class WebhookResponseDto {
  @ApiProperty({ example: 'clxyz123', description: 'Webhook ID' })
  id: string;

  @ApiProperty({ example: 'session-id', description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ example: true, description: 'Webhook enabled status' })
  enabled: boolean;

  @ApiProperty({
    example: 'https://example.com/webhook',
    description: 'Webhook URL',
  })
  url: string;

  @ApiProperty({
    example: ['messages.upsert'],
    description: 'Subscribed events',
  })
  events: string[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export { SuccessResponseDto } from '../../../common/dto';
