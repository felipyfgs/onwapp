import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { SendMessageBaseDto } from './send-message-base.dto';

export class SendForwardMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'ID da mensagem a encaminhar',
    example: '3EB0ABCD123456',
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({
    description: 'JID de onde a mensagem veio',
    example: '5511999999999@s.whatsapp.net',
  })
  @IsString()
  @IsNotEmpty()
  fromJid: string;

  @ApiProperty({
    description: 'Forçar exibição como encaminhada',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
