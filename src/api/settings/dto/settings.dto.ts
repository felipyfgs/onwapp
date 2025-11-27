import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PrivacySettingsDto {
  @ApiPropertyOptional({
    enum: ['all', 'contacts', 'contact_blacklist', 'none'],
    description: 'Who can see your last seen',
  })
  @IsEnum(['all', 'contacts', 'contact_blacklist', 'none'])
  @IsOptional()
  last_seen?: 'all' | 'contacts' | 'contact_blacklist' | 'none';

  @ApiPropertyOptional({
    enum: ['all', 'match_last_seen'],
    description: 'Who can see when you are online',
  })
  @IsEnum(['all', 'match_last_seen'])
  @IsOptional()
  online?: 'all' | 'match_last_seen';

  @ApiPropertyOptional({
    enum: ['all', 'contacts', 'contact_blacklist', 'none'],
    description: 'Who can see your profile picture',
  })
  @IsEnum(['all', 'contacts', 'contact_blacklist', 'none'])
  @IsOptional()
  profile_picture?: 'all' | 'contacts' | 'contact_blacklist' | 'none';

  @ApiPropertyOptional({
    enum: ['all', 'contacts', 'contact_blacklist', 'none'],
    description: 'Who can see your status',
  })
  @IsEnum(['all', 'contacts', 'contact_blacklist', 'none'])
  @IsOptional()
  status?: 'all' | 'contacts' | 'contact_blacklist' | 'none';

  @ApiPropertyOptional({
    enum: ['all', 'none'],
    description: 'Read receipts setting',
  })
  @IsEnum(['all', 'none'])
  @IsOptional()
  read_receipts?: 'all' | 'none';

  @ApiPropertyOptional({
    enum: ['all', 'contacts', 'contact_blacklist'],
    description: 'Who can add you to groups',
  })
  @IsEnum(['all', 'contacts', 'contact_blacklist'])
  @IsOptional()
  groups_add?: 'all' | 'contacts' | 'contact_blacklist';

  @ApiPropertyOptional({
    enum: ['all', 'known'],
    description: 'Who can call you',
  })
  @IsEnum(['all', 'known'])
  @IsOptional()
  calls?: 'all' | 'known';

  @ApiPropertyOptional({
    enum: ['all', 'contacts'],
    description: 'Who can message you',
  })
  @IsEnum(['all', 'contacts'])
  @IsOptional()
  messages?: 'all' | 'contacts';
}

export class ProfileSettingsDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Profile display name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'Hello World!',
    description: 'Profile status message',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: 'Profile picture URL',
  })
  @IsString()
  @IsOptional()
  picture?: string;
}

export class BehaviorSettingsDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Automatically reject incoming calls',
  })
  @IsBoolean()
  @IsOptional()
  reject_call?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Ignore group messages',
  })
  @IsBoolean()
  @IsOptional()
  groups_ignore?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Always appear online',
  })
  @IsBoolean()
  @IsOptional()
  always_online?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Automatically mark messages as read',
  })
  @IsBoolean()
  @IsOptional()
  read_messages?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Automatically read status updates',
  })
  @IsBoolean()
  @IsOptional()
  read_status?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Sync full message history on connection',
  })
  @IsBoolean()
  @IsOptional()
  sync_full_history?: boolean;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ type: PrivacySettingsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => PrivacySettingsDto)
  @IsOptional()
  privacy?: PrivacySettingsDto;

  @ApiPropertyOptional({ type: ProfileSettingsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ProfileSettingsDto)
  @IsOptional()
  profile?: ProfileSettingsDto;

  @ApiPropertyOptional({ type: BehaviorSettingsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => BehaviorSettingsDto)
  @IsOptional()
  behavior?: BehaviorSettingsDto;
}

export class SettingsResponseDto {
  @ApiProperty({ type: PrivacySettingsDto })
  privacy: PrivacySettingsDto;

  @ApiProperty({ type: ProfileSettingsDto })
  profile: ProfileSettingsDto;

  @ApiProperty({ type: BehaviorSettingsDto })
  behavior: BehaviorSettingsDto;
}

export { SuccessResponseDto } from '../../../common/dto';
