import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class DeleteMessageDto {
  @ApiProperty({
    description: 'ID da mensagem a deletar',
    example: '3EB0ABCD123456',
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({
    description: 'JID do destinatário',
    example: '5511999999999@s.whatsapp.net',
  })
  @IsString()
  @IsNotEmpty()
  remoteJid: string;

  @ApiProperty({
    description: 'Mensagem foi enviada por mim',
    example: true,
  })
  @IsBoolean()
  fromMe: boolean;

  @ApiProperty({
    description: 'Participante (para grupos)',
    required: false,
  })
  @IsOptional()
  @IsString()
  participant?: string;
}
