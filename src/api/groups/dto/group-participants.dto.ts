import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsEnum, ArrayMinSize } from 'class-validator';

export enum ParticipantAction {
  ADD = 'add',
  REMOVE = 'remove',
  PROMOTE = 'promote',
  DEMOTE = 'demote',
}

export class GroupParticipantsDto {
  @ApiProperty({
    example: ['5511999999999', '5511888888888'],
    description: 'Array of phone numbers',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participants: string[];

  @ApiProperty({
    enum: ParticipantAction,
    example: 'add',
    description: 'Action to perform: add, remove, promote, demote',
  })
  @IsEnum(ParticipantAction)
  action: ParticipantAction;
}
