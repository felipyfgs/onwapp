import {
  IsBoolean,
  IsOptional,
  IsString,
  IsNumber,
  IsUrl,
  IsArray,
} from 'class-validator';

export class ChatwootDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  token?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  inbox?: string;

  @IsBoolean()
  @IsOptional()
  signMsg?: boolean;

  @IsString()
  @IsOptional()
  signDelimiter?: string;

  @IsBoolean()
  @IsOptional()
  reopen?: boolean;

  @IsBoolean()
  @IsOptional()
  pending?: boolean;

  @IsBoolean()
  @IsOptional()
  mergeBrazil?: boolean;

  @IsBoolean()
  @IsOptional()
  importContacts?: boolean;

  @IsBoolean()
  @IsOptional()
  importMessages?: boolean;

  @IsNumber()
  @IsOptional()
  importDays?: number;

  @IsString()
  @IsOptional()
  organization?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ignoreJids?: string[];
}

export class ChatwootResponseDto extends ChatwootDto {
  id: string;
  sessionId: string;
  webhookUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
