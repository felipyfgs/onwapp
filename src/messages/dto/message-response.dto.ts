import { ApiProperty } from '@nestjs/swagger';

export enum MessageStatus {
  ERROR = 'ERROR',
  PENDING = 'PENDING',
  SERVER_ACK = 'SERVER_ACK',
  DELIVERY_ACK = 'DELIVERY_ACK',
  READ = 'READ',
  PLAYED = 'PLAYED',
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'ID da mensagem',
    example: '3EB0ABCD123456',
  })
  id: string;

  @ApiProperty({
    description: 'JID do destinatário',
    example: '5511999999999@s.whatsapp.net',
  })
  remoteJid: string;

  @ApiProperty({
    description: 'Mensagem foi enviada por mim',
    example: true,
  })
  fromMe: boolean;

  @ApiProperty({
    description: 'Timestamp da mensagem',
    example: '2024-01-01T12:00:00.000Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Status da mensagem',
    enum: MessageStatus,
    example: MessageStatus.SERVER_ACK,
  })
  status: string;

  @ApiProperty({
    description: 'Participante que enviou a mensagem (em grupos)',
    required: false,
  })
  participant?: string;
}
