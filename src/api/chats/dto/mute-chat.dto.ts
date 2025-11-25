import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class MuteChatDto {
  @ApiProperty({
    description: 'Duração do mute em milissegundos (ex: 28800000 = 8 horas)',
    example: 28800000,
    minimum: 1000,
  })
  @IsInt()
  @Min(1000)
  duration: number;
}
