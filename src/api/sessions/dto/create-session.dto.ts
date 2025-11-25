import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WebhookConfigDto } from './webhook-config.dto';
import { ChatwootConfigDto } from './chatwoot-config.dto';
import { ProxyDto } from './proxy.dto';

export class CreateSessionDto {
  @ApiProperty({
    description: 'Nome da sessão',
    example: 'Minha Sessão WhatsApp',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Configuração de webhook',
    type: WebhookConfigDto,
  })
  @ValidateNested()
  @Type(() => WebhookConfigDto)
  @IsOptional()
  webhook?: WebhookConfigDto;

  @ApiPropertyOptional({
    description: 'Configuração do Chatwoot',
    type: ChatwootConfigDto,
  })
  @ValidateNested()
  @Type(() => ChatwootConfigDto)
  @IsOptional()
  chatwoot?: ChatwootConfigDto;

  @ApiPropertyOptional({
    description: 'Configuração de proxy',
    type: ProxyDto,
  })
  @ValidateNested()
  @Type(() => ProxyDto)
  @IsOptional()
  proxy?: ProxyDto;
}
