import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class MessageToClearDto {
  @ApiProperty({
    description: 'ID da mensagem',
    example: 'messageId123',
  })
  id: string;

  @ApiProperty({
    description: 'Se a mensagem é do próprio usuário',
    example: true,
    required: false,
  })
  fromMe?: boolean;

  @ApiProperty({
    description: 'Timestamp da mensagem',
    example: 1234567890,
  })
  timestamp: number;
}

export class ClearMessagesDto {
  @ApiProperty({
    description:
      'Lista de mensagens a serem limpadas. Se não fornecida, limpa todas as mensagens',
    type: [MessageToClearDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageToClearDto)
  messages?: Array<{
    id: string;
    fromMe?: boolean;
    timestamp: number;
  }>;
}
