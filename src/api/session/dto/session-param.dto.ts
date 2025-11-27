import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class SessionParamDto {
  @ApiProperty({
    example: 'my-session',
    description: 'Session name (alphanumeric and hyphens only)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9-]+$/, {
    message: 'Session name must be alphanumeric with hyphens only',
  })
  name: string;
}
