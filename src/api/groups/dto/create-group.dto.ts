import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    example: 'My Group',
    description: 'Group subject/name',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    example: ['5511999999999', '5511888888888'],
    description: 'Array of phone numbers to add as participants',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participants: string[];
}
