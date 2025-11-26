import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LinkGroupDto {
  @ApiProperty({ description: 'ID do grupo a vincular' })
  @IsString()
  @IsNotEmpty()
  groupId: string;
}
