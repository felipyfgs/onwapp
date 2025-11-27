import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateGroupSubjectDto {
  @ApiProperty({
    example: 'New Group Name',
    description: 'New subject/name for the group',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;
}
