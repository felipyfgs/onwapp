import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsIn } from 'class-validator';

export class ToggleEphemeralDto {
  @ApiProperty({
    description: 'Duração das mensagens temporárias em segundos (0 para desativar, 86400 = 24h, 604800 = 7d, 7776000 = 90d)',
    example: 86400,
  })
  @IsNumber()
  @IsIn([0, 86400, 604800, 7776000])
  expiration: number;
}
