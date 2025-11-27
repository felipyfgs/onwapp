import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum GroupSetting {
  ANNOUNCEMENT = 'announcement',
  NOT_ANNOUNCEMENT = 'not_announcement',
  LOCKED = 'locked',
  UNLOCKED = 'unlocked',
}

export class GroupSettingsDto {
  @ApiProperty({
    enum: GroupSetting,
    example: 'announcement',
    description:
      'Group setting: announcement (only admins send), not_announcement (all send), locked (only admins edit), unlocked (all edit)',
  })
  @IsEnum(GroupSetting)
  setting: GroupSetting;
}
