import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class SetDisappearingMessagesDto {
  @ApiProperty({
    description: 'JID do chat',
    example: '5511999999999@s.whatsapp.net',
  })
  @IsString()
  @IsNotEmpty()
  jid: string;

  @ApiProperty({
    description: 'Tempo de expiração em segundos (0 para desativar)',
    example: 86400,
  })
  @IsNumber()
  expiration: number;
}
