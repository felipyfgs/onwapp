import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Content attributes in Chatwoot webhook payload
 */
export class ChatwootContentAttributesDto {
  @ApiPropertyOptional({
    description: 'Chatwoot message ID being replied to',
  })
  @IsNumber()
  @IsOptional()
  in_reply_to?: number;

  @ApiPropertyOptional({
    description: 'External (WhatsApp) message ID being replied to',
  })
  @IsString()
  @IsOptional()
  in_reply_to_external_id?: string;

  @ApiPropertyOptional({
    description: 'Whether the message was deleted',
  })
  @IsBoolean()
  @IsOptional()
  deleted?: boolean;
}

/**
 * Sender metadata in conversation
 */
export class ChatwootSenderMetaDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  identifier?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone_number?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;
}

/**
 * Conversation meta in webhook payload
 */
export class ChatwootConversationMetaDto {
  @ApiPropertyOptional({ type: ChatwootSenderMetaDto })
  @ValidateNested()
  @Type(() => ChatwootSenderMetaDto)
  @IsOptional()
  sender?: ChatwootSenderMetaDto;
}

/**
 * Conversation in webhook payload
 */
export class ChatwootWebhookConversationDto {
  @ApiPropertyOptional()
  @IsNumber()
  id: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ type: ChatwootConversationMetaDto })
  @ValidateNested()
  @Type(() => ChatwootConversationMetaDto)
  @IsOptional()
  meta?: ChatwootConversationMetaDto;
}

/**
 * Sender in webhook payload
 */
export class ChatwootWebhookSenderDto {
  @ApiPropertyOptional()
  @IsNumber()
  id: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  type?: string;
}

/**
 * Attachment in webhook payload
 */
export class ChatwootWebhookAttachmentDto {
  @ApiPropertyOptional()
  @IsString()
  file_type: string;

  @ApiPropertyOptional()
  @IsString()
  data_url: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  thumb_url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  file_name?: string;
}

/**
 * Full Chatwoot webhook payload DTO
 */
export class ChatwootWebhookPayloadDto {
  @ApiPropertyOptional({
    description: 'Chatwoot message ID',
  })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiPropertyOptional({
    description: 'Event type',
    example: 'message_created',
  })
  @IsString()
  @IsOptional()
  event?: string;

  @ApiPropertyOptional({
    description: 'Message type',
    example: 'outgoing',
  })
  @IsString()
  @IsOptional()
  message_type?: string;

  @ApiPropertyOptional({
    description: 'Message content',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: 'Whether message is private',
  })
  @IsBoolean()
  @IsOptional()
  private?: boolean;

  @ApiPropertyOptional({
    description: 'Source ID (message origin)',
  })
  @IsString()
  @IsOptional()
  source_id?: string;

  @ApiPropertyOptional({
    description: 'Content attributes (reply info, deleted status)',
    type: ChatwootContentAttributesDto,
  })
  @ValidateNested()
  @Type(() => ChatwootContentAttributesDto)
  @IsOptional()
  content_attributes?: ChatwootContentAttributesDto;

  @ApiPropertyOptional({
    description: 'Conversation details',
    type: ChatwootWebhookConversationDto,
  })
  @ValidateNested()
  @Type(() => ChatwootWebhookConversationDto)
  @IsOptional()
  conversation?: ChatwootWebhookConversationDto;

  @ApiPropertyOptional({
    description: 'Sender details',
    type: ChatwootWebhookSenderDto,
  })
  @ValidateNested()
  @Type(() => ChatwootWebhookSenderDto)
  @IsOptional()
  sender?: ChatwootWebhookSenderDto;

  @ApiPropertyOptional({
    description: 'Message attachments',
    type: [ChatwootWebhookAttachmentDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ChatwootWebhookAttachmentDto)
  @IsArray()
  @IsOptional()
  attachments?: ChatwootWebhookAttachmentDto[];
}

/**
 * Zpwoot event payload DTO
 */
export class ZpwootEventPayloadDto {
  @ApiPropertyOptional({
    description: 'Session ID',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Event type',
    example: 'messages.upsert',
  })
  @IsString()
  event: string;

  @ApiPropertyOptional({
    description: 'Event timestamp',
  })
  @IsString()
  timestamp: string;

  @ApiPropertyOptional({
    description: 'Event data',
  })
  @IsObject()
  data: Record<string, unknown>;
}
