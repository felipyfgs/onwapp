import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class DownloadMediaDto {
  @ApiProperty({
    description: 'Mensagem completa do WhatsApp (proto.WebMessageInfo)',
    example: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        id: 'messageId123',
      },
      message: {
        imageMessage: {
          url: '...',
          mimetype: 'image/jpeg',
        },
      },
    },
  })
  @IsObject()
  message: any;

  @ApiProperty({
    description: 'Tipo de mensagem (imageMessage, videoMessage, etc.)',
    required: false,
  })
  @IsOptional()
  @IsString()
  messageType?: string;
}
