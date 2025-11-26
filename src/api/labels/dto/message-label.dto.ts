import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class MessageLabelDto {
  @ApiProperty({ description: 'JID do chat' })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({ description: 'ID da mensagem' })
  @IsString()
  @IsNotEmpty()
  messageId: string;
}
