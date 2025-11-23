import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { LastMessage } from '../../common/interfaces/last-message.interface';

class LastMessageDto {
  @ApiProperty({
    description: 'Chave da mensagem',
  })
  key: {
    remoteJid: string;
    id: string;
    participant?: string;
  };

  @ApiProperty({
    description: 'Timestamp da mensagem',
  })
  messageTimestamp: number;
}

export class MarkReadDto {
  @ApiProperty({
    description: 'Lista de últimas mensagens do chat (opcional)',
    type: [LastMessageDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LastMessageDto)
  lastMessages?: LastMessage[];
}
