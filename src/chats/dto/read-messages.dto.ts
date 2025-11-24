import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { MessageKey } from '../../common/interfaces/message-key.interface';

class MessageKeyDto implements MessageKey {
  @ApiProperty({
    description: 'JID remoto do chat',
    example: '5511999999999@s.whatsapp.net',
  })
  remoteJid: string;

  @ApiProperty({
    description: 'ID da mensagem',
    example: 'messageId123',
  })
  id: string;

  @ApiProperty({
    description: 'Participante (para mensagens de grupo)',
    required: false,
  })
  participant?: string;
}

export class ReadMessagesDto {
  @ApiProperty({
    description: 'Lista de chaves de mensagens a serem marcadas como lidas',
    type: [MessageKeyDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  keys: MessageKey[];
}
