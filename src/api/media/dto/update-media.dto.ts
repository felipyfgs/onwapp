import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateMediaDto {
  @ApiProperty({
    description:
      'Mensagem completa do WhatsApp para re-upload (proto.WebMessageInfo)',
    example: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        id: 'messageId123',
      },
      message: {
        imageMessage: {
          url: '...',
        },
      },
    },
  })
  @IsObject()
  message: any;
}
