import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ForwardMessageKeyDto {
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
}

export class ForwardMessageDto {
  @ApiProperty({
    description: 'Phone number or WhatsApp ID to forward to',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Message key to forward',
    type: ForwardMessageKeyDto,
  })
  @ValidateNested()
  @Type(() => ForwardMessageKeyDto)
  messageKey: ForwardMessageKeyDto;
}
