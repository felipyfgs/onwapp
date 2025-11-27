import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteMessageKeyDto {
  @ApiProperty({ description: 'Remote JID (chat ID)' })
  @IsString()
  @IsNotEmpty()
  remoteJid: string;

  @ApiProperty({ description: 'Message ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Whether message was sent by me' })
  @IsBoolean()
  fromMe: boolean;

  @ApiPropertyOptional({ description: 'Participant JID (for groups)' })
  @IsOptional()
  @IsString()
  participant?: string;
}

export class DeleteMessageDto {
  @ApiProperty({
    description: 'Phone number or WhatsApp ID',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Message key to delete',
    type: DeleteMessageKeyDto,
  })
  @ValidateNested()
  @Type(() => DeleteMessageKeyDto)
  messageKey: DeleteMessageKeyDto;
}

export class DeleteMessageForMeDto {
  @ApiProperty({
    description: 'Phone number or WhatsApp ID',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Message ID' })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({ description: 'Whether message was sent by me' })
  @IsBoolean()
  fromMe: boolean;

  @ApiProperty({ description: 'Message timestamp (Unix timestamp in seconds)' })
  @IsNotEmpty()
  timestamp: number;
}
