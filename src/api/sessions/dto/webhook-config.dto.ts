import {
  IsBoolean,
  IsOptional,
  IsString,
  IsArray,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookConfigDto {
  @ApiPropertyOptional({ description: 'Habilitar webhook', default: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'URL do webhook',
    example: 'https://meu-servidor.com/webhook',
  })
  @IsUrl({ require_tld: false })
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({
    description: 'Eventos a serem enviados',
    example: ['messages.upsert', 'connection.update'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  events?: string[];
}

export class WebhookResponseDto extends WebhookConfigDto {
  @ApiProperty({ description: 'ID do webhook' })
  id: string;

  @ApiProperty({ description: 'ID da sessão' })
  sessionId: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
