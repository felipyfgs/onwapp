import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { SendMessageBaseDto } from './send-message-base.dto';

export class SendReactionMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'ID da mensagem a reagir',
    example: '3EB0ABCD123456',
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({
    description: 'JID de quem enviou a mensagem (para grupos)',
    required: false,
  })
  @IsOptional()
  @IsString()
  participant?: string;

  @ApiProperty({
    description: 'Emoji da reação',
    example: '👍',
  })
  @IsString()
  @IsNotEmpty()
  emoji: string;
}
