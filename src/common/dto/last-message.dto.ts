import { ApiProperty } from '@nestjs/swagger';

export class LastMessageDto {
  @ApiProperty({
    description: 'Chave da mensagem',
    example: {
      remoteJid: '5511999999999@s.whatsapp.net',
      id: 'messageId123',
      participant: undefined,
    },
  })
  key: {
    remoteJid: string;
    id: string;
    participant?: string;
  };

  @ApiProperty({
    description: 'Timestamp da mensagem',
    example: 1234567890,
  })
  messageTimestamp: number;
}
