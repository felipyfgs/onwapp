import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsIn, ArrayMinSize } from 'class-validator';

export class UpdateCommunityParticipantsDto {
  @ApiProperty({ description: 'Lista de JIDs dos participantes' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  participants: string[];

  @ApiProperty({ description: 'Ação', enum: ['add', 'remove', 'promote', 'demote'] })
  @IsString()
  @IsIn(['add', 'remove', 'promote', 'demote'])
  action: 'add' | 'remove' | 'promote' | 'demote';
}
