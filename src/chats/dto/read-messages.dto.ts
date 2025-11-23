import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageKey } from '../../common/interfaces/message-key.interface';

export class ReadMessagesDto {
  @ApiProperty({
    description: 'Lista de chaves de mensagens a serem marcadas como lidas',
    type: 'object',
    example: [
      {
        remoteJid: '5511999999999@s.whatsapp.net',
        id: 'messageId123',
        participant: undefined,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  keys: MessageKey[];
}
