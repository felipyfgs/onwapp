import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsObject } from 'class-validator';
import { SendMessageBaseDto } from './send-message-base.dto';

export class SendForwardMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'Mensagem completa a encaminhar (proto.IWebMessageInfo)',
    example: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: true,
        id: '3EB0ABCD123456',
      },
      message: { conversation: 'Olá' },
      messageTimestamp: 1234567890,
    },
  })
  @IsObject()
  message: any;

  @ApiProperty({
    description: 'Forçar exibição como encaminhada',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
