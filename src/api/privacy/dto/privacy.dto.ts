import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export type PrivacyValue = 'all' | 'contacts' | 'contact_blacklist' | 'none';
export type PrivacyOnlineValue = 'all' | 'match_last_seen';
export type PrivacyGroupAddValue = 'all' | 'contacts' | 'contact_blacklist';
export type PrivacyReadReceiptsValue = 'all' | 'none';
export type PrivacyCallValue = 'all' | 'known';
export type PrivacyMessagesValue = 'all' | 'contacts' | 'contact_blacklist';

export class UpdateLastSeenPrivacyDto {
  @ApiProperty({
    enum: ['all', 'contacts', 'contact_blacklist', 'none'],
    description: 'Who can see your last seen',
  })
  @IsEnum(['all', 'contacts', 'contact_blacklist', 'none'])
  value: PrivacyValue;
}

export class UpdateOnlinePrivacyDto {
  @ApiProperty({
    enum: ['all', 'match_last_seen'],
    description: 'Who can see when you are online',
  })
  @IsEnum(['all', 'match_last_seen'])
  value: PrivacyOnlineValue;
}

export class UpdateProfilePicturePrivacyDto {
  @ApiProperty({
    enum: ['all', 'contacts', 'contact_blacklist', 'none'],
    description: 'Who can see your profile picture',
  })
  @IsEnum(['all', 'contacts', 'contact_blacklist', 'none'])
  value: PrivacyValue;
}

export class UpdateStatusPrivacyDto {
  @ApiProperty({
    enum: ['all', 'contacts', 'contact_blacklist', 'none'],
    description: 'Who can see your status',
  })
  @IsEnum(['all', 'contacts', 'contact_blacklist', 'none'])
  value: PrivacyValue;
}

export class UpdateReadReceiptsPrivacyDto {
  @ApiProperty({
    enum: ['all', 'none'],
    description: 'Read receipts setting',
  })
  @IsEnum(['all', 'none'])
  value: PrivacyReadReceiptsValue;
}

export class UpdateGroupsAddPrivacyDto {
  @ApiProperty({
    enum: ['all', 'contacts', 'contact_blacklist'],
    description: 'Who can add you to groups',
  })
  @IsEnum(['all', 'contacts', 'contact_blacklist'])
  value: PrivacyGroupAddValue;
}

export class UpdateCallPrivacyDto {
  @ApiProperty({
    enum: ['all', 'known'],
    description: 'Who can call you',
  })
  @IsEnum(['all', 'known'])
  value: PrivacyCallValue;
}

export class UpdateMessagesPrivacyDto {
  @ApiProperty({
    enum: ['all', 'contacts', 'contact_blacklist'],
    description: 'Who can message you',
  })
  @IsEnum(['all', 'contacts', 'contact_blacklist'])
  value: PrivacyMessagesValue;
}

export class PrivacySettingsResponseDto {
  @ApiProperty({ description: 'Last seen privacy setting' })
  @IsOptional()
  last?: string;

  @ApiProperty({ description: 'Online privacy setting' })
  @IsOptional()
  online?: string;

  @ApiProperty({ description: 'Profile picture privacy setting' })
  @IsOptional()
  profile?: string;

  @ApiProperty({ description: 'Status privacy setting' })
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Read receipts setting' })
  @IsOptional()
  readreceipts?: string;

  @ApiProperty({ description: 'Group add privacy setting' })
  @IsOptional()
  groupadd?: string;

  @ApiProperty({ description: 'Call privacy setting' })
  @IsOptional()
  calladd?: string;

  @ApiProperty({ description: 'Messages privacy setting' })
  @IsOptional()
  messages?: string;
}

export class SuccessResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;
}
