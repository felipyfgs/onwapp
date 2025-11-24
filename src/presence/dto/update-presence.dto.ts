import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, Matches } from 'class-validator';
import { WAPresence } from '../../common/constants/presence.enum';

export class UpdatePresenceDto {
  @ApiProperty({
    description: 'Tipo de presença',
    enum: WAPresence,
    example: WAPresence.AVAILABLE,
  })
  @IsEnum(WAPresence)
  presence: WAPresence;

  @ApiProperty({
    description:
      'JID do chat (opcional, envia presença para um chat específico)',
    required: false,
    example: '5511999999999@s.whatsapp.net',
  })
  @IsOptional()
  @IsString()
  @Matches(/@(s\.whatsapp\.net|g\.us)$/, {
    message: 'JID deve terminar com @s.whatsapp.net ou @g.us',
  })
  jid?: string;
}
