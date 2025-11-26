import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for Chatwoot configuration response
 */
export class ChatwootConfigResponseDto {
  @ApiProperty({
    description: 'Configuration ID',
    example: 'clxyz123456',
  })
  id: string;

  @ApiProperty({
    description: 'Session ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Integration enabled status',
    example: true,
  })
  enabled: boolean;

  @ApiPropertyOptional({
    description: 'Chatwoot account ID',
    example: '1',
  })
  accountId?: string | null;

  @ApiPropertyOptional({
    description: 'Chatwoot instance URL',
    example: 'https://chatwoot.example.com',
  })
  url?: string | null;

  @ApiPropertyOptional({
    description: 'Inbox name',
    example: 'WhatsApp Business',
  })
  inbox?: string | null;

  @ApiProperty({
    description: 'Sign messages with sender name',
    example: false,
  })
  signMsg: boolean;

  @ApiPropertyOptional({
    description: 'Sign delimiter',
    example: '\\n',
  })
  signDelimiter?: string | null;

  @ApiProperty({
    description: 'Reopen resolved conversations (single conversation per contact)',
    example: true,
  })
  reopenConversation: boolean;

  @ApiProperty({
    description: 'Create conversations as pending',
    example: false,
  })
  pending: boolean;

  @ApiProperty({
    description: 'Merge Brazilian phone variants',
    example: false,
  })
  mergeBrazil: boolean;

  @ApiProperty({
    description: 'Import contacts',
    example: false,
  })
  importContacts: boolean;

  @ApiProperty({
    description: 'Import messages',
    example: false,
  })
  importMessages: boolean;

  @ApiPropertyOptional({
    description: 'Import days limit',
    example: 3,
  })
  importDays?: number | null;

  @ApiPropertyOptional({
    description: 'Organization name',
  })
  organization?: string | null;

  @ApiPropertyOptional({
    description: 'Logo URL',
  })
  logo?: string | null;

  @ApiProperty({
    description: 'Ignored JIDs',
    type: [String],
    example: [],
  })
  ignoreJids: string[];

  @ApiProperty({
    description: 'Webhook URL to configure in Chatwoot',
    example: 'http://localhost:3000/chatwoot/webhook/session-id',
  })
  webhookUrl: string;

  @ApiProperty({
    description: 'Created timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated timestamp',
  })
  updatedAt: Date;
}

/**
 * DTO for not configured response
 */
export class ChatwootNotConfiguredResponseDto {
  @ApiProperty({
    description: 'Integration enabled status',
    example: false,
  })
  enabled: boolean;

  @ApiProperty({
    description: 'Status message',
    example: 'Chatwoot not configured for this session',
  })
  message: string;
}

/**
 * DTO for delete response
 */
export class ChatwootDeleteResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Status message',
    example: 'Chatwoot configuration deleted',
  })
  message: string;
}

/**
 * DTO for webhook processing response
 */
export class ChatwootWebhookResponseDto {
  @ApiProperty({
    description: 'Processing status',
    example: 'sent',
    enum: ['sent', 'ignored', 'deleted', 'error'],
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Reason for status',
    example: 'Message from API (has source_id)',
  })
  reason?: string;

  @ApiPropertyOptional({
    description: 'Media type if applicable',
    example: 'image',
  })
  type?: string;

  @ApiPropertyOptional({
    description: 'Target chat ID',
    example: '5511999999999@s.whatsapp.net',
  })
  chatId?: string;

  @ApiPropertyOptional({
    description: 'Error message if failed',
  })
  error?: string;
}

/**
 * DTO for zpwoot event processing response
 */
export class ZpwootEventResponseDto {
  @ApiProperty({
    description: 'Whether the event was processed',
    example: true,
  })
  processed: boolean;

  @ApiPropertyOptional({
    description: 'Processing result reason',
    example: 'Processed 1/1 messages',
  })
  reason?: string;

  @ApiPropertyOptional({
    description: 'Error message if failed',
  })
  error?: string;
}
