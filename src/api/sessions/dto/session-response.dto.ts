import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookResponseDto } from './webhook-config.dto';
import { ProxyResponseDto } from './proxy.dto';

export class ChatwootResponseDto {
  @ApiProperty({ description: 'ID do Chatwoot' })
  id: string;

  @ApiProperty({ description: 'ID da sessão' })
  sessionId: string;

  @ApiPropertyOptional({ description: 'Habilitado' })
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'ID da conta' })
  accountId?: string;

  @ApiPropertyOptional({ description: 'URL do Chatwoot' })
  url?: string;

  @ApiPropertyOptional({ description: 'Nome do inbox' })
  inbox?: string;

  @ApiPropertyOptional({ description: 'Assinar mensagens' })
  signMsg?: boolean;

  @ApiPropertyOptional({
    description: 'Reabrir conversas resolvidas (conversa única por contato)',
  })
  reopenConversation?: boolean;

  @ApiPropertyOptional({ description: 'Conversas pendentes' })
  pending?: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

export class SessionResponseDto {
  @ApiProperty({
    description: 'ID único da sessão',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da sessão',
    example: 'Minha Sessão WhatsApp',
  })
  name: string;

  @ApiProperty({
    description: 'Status da sessão',
    example: 'connected',
    enum: ['connected', 'disconnected', 'connecting'],
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Código QR para pareamento',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
  })
  qrCode?: string;

  @ApiPropertyOptional({
    description: 'Número de telefone pareado',
    example: '+5511999999999',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Configuração de webhook',
    type: WebhookResponseDto,
  })
  webhook?: WebhookResponseDto;

  @ApiPropertyOptional({
    description: 'Configuração do Chatwoot',
    type: ChatwootResponseDto,
  })
  chatwoot?: ChatwootResponseDto;

  @ApiPropertyOptional({
    description: 'Configuração de proxy',
    type: ProxyResponseDto,
  })
  proxy?: ProxyResponseDto;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-11-22T19:07:27.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-11-22T19:07:27.000Z',
  })
  updatedAt: Date;
}
