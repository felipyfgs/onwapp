import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ example: 'my-session', description: 'Session name' })
  name: string;
}
