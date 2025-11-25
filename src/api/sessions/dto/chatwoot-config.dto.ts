import {
  IsBoolean,
  IsOptional,
  IsString,
  IsNumber,
  IsUrl,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ChatwootConfigDto {
  @ApiPropertyOptional({ description: 'Habilitar Chatwoot', default: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'ID da conta Chatwoot', example: '1' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Token de acesso Chatwoot' })
  @IsString()
  @IsOptional()
  token?: string;

  @ApiPropertyOptional({
    description: 'URL do Chatwoot',
    example: 'https://chatwoot.example.com',
  })
  @IsUrl({ require_tld: false })
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({
    description: 'Nome do inbox',
    example: 'WhatsApp Business',
  })
  @IsString()
  @IsOptional()
  inbox?: string;

  @ApiPropertyOptional({
    description: 'Assinar mensagens em grupos com nome do remetente',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  signMsg?: boolean;

  @ApiPropertyOptional({
    description: 'Delimitador da assinatura',
    default: '\\n',
  })
  @IsString()
  @IsOptional()
  signDelimiter?: string;

  @ApiPropertyOptional({
    description: 'Reabrir conversas resolvidas',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  reopen?: boolean;

  @ApiPropertyOptional({
    description: 'Criar conversas como pendentes',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  pending?: boolean;

  @ApiPropertyOptional({
    description: 'Mesclar contatos brasileiros (com/sem 9)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  mergeBrazil?: boolean;

  @ApiPropertyOptional({ description: 'Importar contatos', default: false })
  @IsBoolean()
  @IsOptional()
  importContacts?: boolean;

  @ApiPropertyOptional({ description: 'Importar mensagens', default: false })
  @IsBoolean()
  @IsOptional()
  importMessages?: boolean;

  @ApiPropertyOptional({
    description: 'Limite de dias para importar mensagens',
    default: 3,
  })
  @IsNumber()
  @IsOptional()
  importDays?: number;

  @ApiPropertyOptional({ description: 'JIDs a ignorar', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ignoreJids?: string[];
}
