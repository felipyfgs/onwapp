import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { SendMessageBaseDto } from './send-message-base.dto';

export class SendTextMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'Texto da mensagem',
    example: 'Olá! Como vai?',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'JIDs mencionados na mensagem',
    required: false,
    type: [String],
    example: ['5511999999999@s.whatsapp.net'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];
}
