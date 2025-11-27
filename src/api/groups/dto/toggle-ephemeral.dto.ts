import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class ToggleEphemeralDto {
  @ApiProperty({
    description:
      'Ephemeral message expiration in seconds (0 to disable, 86400 for 24h, 604800 for 7d, 7776000 for 90d)',
    example: 86400,
  })
  @IsNumber()
  @Min(0)
  expiration: number;
}
