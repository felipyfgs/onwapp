import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class BlockUserDto {
  @ApiProperty({
    description: 'JID do usuário a ser bloqueado/desbloqueado',
    example: '5511999999999@s.whatsapp.net',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/@s\.whatsapp\.net$/, {
    message: 'JID deve terminar com @s.whatsapp.net',
  })
  jid: string;
}
