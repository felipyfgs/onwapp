import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class LinkGroupDto {
  @ApiProperty({ description: 'IDs dos grupos' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  groupIds: string[];
}
