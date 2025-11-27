import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class JoinGroupDto {
  @ApiProperty({
    example: 'AbCdEfGhIjK',
    description: 'Group invite code',
  })
  @IsString()
  @IsNotEmpty()
  inviteCode: string;
}
