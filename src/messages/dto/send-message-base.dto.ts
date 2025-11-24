import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
} from 'class-validator';

export class QuotedMessageDto {
  @ApiProperty({
    description: 'JID remoto da mensagem citada',
    example: '5511999999999@s.whatsapp.net',
  })
  @IsString()
  @IsNotEmpty()
  remoteJid: string;

  @ApiProperty({
    description: 'Mensagem foi enviada por mim',
    example: true,
  })
  @IsNotEmpty()
  fromMe: boolean;

  @ApiProperty({
    description: 'ID da mensagem citada',
    example: '3EB0ABCD123456',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Participante que enviou a mensagem (em grupos)',
    required: false,
  })
  @IsOptional()
  @IsString()
  participant?: string;
}

export class SendMessageBaseDto {
  @ApiProperty({
    description: 'Número WhatsApp do destinatário',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Mensagem citada/respondida',
    required: false,
    type: QuotedMessageDto,
  })
  @IsOptional()
  quoted?: QuotedMessageDto;

  @ApiProperty({
    description: 'Tempo de expiração da mensagem em segundos',
    required: false,
    example: 86400,
  })
  @IsOptional()
  @IsNumber()
  ephemeralExpiration?: number;

  @ApiProperty({
    description: 'Lista de JIDs para status/story',
    required: false,
    type: [String],
    example: ['5511888888888@s.whatsapp.net'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  statusJidList?: string[];
}
