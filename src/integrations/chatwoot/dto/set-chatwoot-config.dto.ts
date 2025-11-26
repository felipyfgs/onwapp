import {
  IsBoolean,
  IsOptional,
  IsString,
  IsNumber,
  IsUrl,
  IsArray,
  ValidateIf,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

/**
 * DTO for setting/updating Chatwoot configuration
 */
export class SetChatwootConfigDto {
  @ApiProperty({
    description: 'Enable or disable Chatwoot integration',
    example: true,
  })
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  enabled: boolean;

  @ApiProperty({
    description: 'Chatwoot account ID',
    example: '1',
    required: false,
  })
  @ValidateIf((o) => o.enabled === true)
  @IsString()
  @IsNotEmpty({ message: 'accountId is required when enabled is true' })
  accountId?: string;

  @ApiProperty({
    description: 'Chatwoot API access token',
    example: 'your-chatwoot-api-token',
    required: false,
  })
  @ValidateIf((o) => o.enabled === true)
  @IsString()
  @IsNotEmpty({ message: 'token is required when enabled is true' })
  token?: string;

  @ApiProperty({
    description: 'Chatwoot instance URL',
    example: 'https://chatwoot.example.com',
    required: false,
  })
  @ValidateIf((o) => o.enabled === true)
  @IsUrl({ require_tld: false }, { message: 'url must be a valid URL' })
  @IsNotEmpty({ message: 'url is required when enabled is true' })
  url?: string;

  @ApiPropertyOptional({
    description: 'Inbox name for this session',
    example: 'WhatsApp Business',
  })
  @IsString()
  @IsOptional()
  inbox?: string;

  @ApiPropertyOptional({
    description: 'Sign messages with sender name (for groups)',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  signMsg?: boolean;

  @ApiPropertyOptional({
    description: 'Delimiter between sender name and message',
    example: '\\n',
    default: '\\n',
  })
  @IsString()
  @IsOptional()
  signDelimiter?: string;

  @ApiPropertyOptional({
    description: 'Reopen resolved conversations on new messages',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  reopen?: boolean;

  @ApiPropertyOptional({
    description: 'Create new conversations as pending',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  pending?: boolean;

  @ApiPropertyOptional({
    description: 'Merge Brazilian phone number variants (+5511 with/without 9)',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  mergeBrazil?: boolean;

  @ApiPropertyOptional({
    description: 'Import WhatsApp contacts to Chatwoot',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  importContacts?: boolean;

  @ApiPropertyOptional({
    description: 'Import WhatsApp message history to Chatwoot',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  importMessages?: boolean;

  @ApiPropertyOptional({
    description: 'Number of days to import messages from',
    example: 3,
    default: 3,
    minimum: 1,
    maximum: 30,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(30)
  importDays?: number;

  @ApiPropertyOptional({
    description: 'Organization name for branding',
    example: 'My Company',
  })
  @IsString()
  @IsOptional()
  organization?: string;

  @ApiPropertyOptional({
    description: 'Logo URL for branding',
    example: 'https://example.com/logo.png',
  })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({
    description: 'List of JIDs to ignore',
    example: ['5511999999999@s.whatsapp.net'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ignoreJids?: string[];

  @ApiPropertyOptional({
    description:
      'PostgreSQL connection URL for direct Chatwoot database access (enables labels, import, sync)',
    example: 'postgresql://postgres:password@localhost:5432/chatwoot',
  })
  @IsString()
  @IsOptional()
  postgresUrl?: string;
}
