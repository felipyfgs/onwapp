import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateGroupDescriptionDto {
  @ApiProperty({
    example: 'This is the group description',
    description: 'New description for the group',
  })
  @IsString()
  description: string;
}
