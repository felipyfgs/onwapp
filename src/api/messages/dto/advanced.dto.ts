import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MessageKeyDto {
  @ApiProperty({ example: 'ABCD1234', description: 'Message ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: true, description: 'Whether the message is from you' })
  @IsBoolean()
  fromMe: boolean;

  @ApiProperty({
    example: '5511999999999@s.whatsapp.net',
    description: 'Remote JID (chat ID)',
  })
  @IsString()
  @IsNotEmpty()
  remoteJid: string;

  @ApiPropertyOptional({
    example: '5511888888888@s.whatsapp.net',
    description: 'Participant JID (for groups)',
  })
  @IsString()
  @IsOptional()
  participant?: string;
}

export class UpdateMediaMessageDto {
  @ApiProperty({
    type: MessageKeyDto,
    description: 'Key of the media message to update',
  })
  @ValidateNested()
  @Type(() => MessageKeyDto)
  messageKey: MessageKeyDto;
}

export class FetchMessageHistoryDto {
  @ApiProperty({
    example: '5511999999999',
    description: 'Chat JID to fetch history from',
  })
  @IsString()
  @IsNotEmpty()
  jid: string;

  @ApiProperty({
    example: 50,
    description: 'Number of messages to fetch',
  })
  @IsNumber()
  count: number;

  @ApiPropertyOptional({
    type: MessageKeyDto,
    description: 'Oldest message key to start from (for pagination)',
  })
  @ValidateNested()
  @IsOptional()
  @Type(() => MessageKeyDto)
  oldestMsgKey?: MessageKeyDto;
}

export class SendReceiptDto {
  @ApiProperty({
    example: '5511999999999@s.whatsapp.net',
    description: 'JID to send receipt to',
  })
  @IsString()
  @IsNotEmpty()
  jid: string;

  @ApiPropertyOptional({
    example: '5511888888888@s.whatsapp.net',
    description: 'Participant JID (for groups)',
  })
  @IsString()
  @IsOptional()
  participant?: string;

  @ApiProperty({
    example: ['MSG123', 'MSG456'],
    description: 'Array of message IDs',
  })
  @IsArray()
  @IsString({ each: true })
  messageIds: string[];

  @ApiProperty({
    example: 'read',
    description: 'Receipt type: read, read-self, played',
    enum: ['read', 'read-self', 'played'],
  })
  @IsString()
  @IsNotEmpty()
  type: 'read' | 'read-self' | 'played';
}

export class SendReceiptsDto {
  @ApiProperty({
    type: [MessageKeyDto],
    description: 'Array of message keys to send receipts for',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageKeyDto)
  keys: MessageKeyDto[];

  @ApiProperty({
    example: 'read',
    description: 'Receipt type: read, read-self, played',
    enum: ['read', 'read-self', 'played'],
  })
  @IsString()
  @IsNotEmpty()
  type: 'read' | 'read-self' | 'played';
}
