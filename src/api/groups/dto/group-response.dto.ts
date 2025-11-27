import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GroupParticipantDto {
  @ApiProperty({ example: '5511999999999@s.whatsapp.net' })
  id: string;

  @ApiPropertyOptional({ example: 'admin' })
  admin?: string;
}

export class GroupMetadataResponseDto {
  @ApiProperty({ example: '123456789@g.us' })
  id: string;

  @ApiProperty({ example: 'My Group' })
  subject: string;

  @ApiPropertyOptional({ example: 'Group description' })
  desc?: string;

  @ApiPropertyOptional({ example: 1234567890 })
  creation?: number;

  @ApiPropertyOptional({ example: '5511999999999@s.whatsapp.net' })
  owner?: string;

  @ApiProperty({ type: [GroupParticipantDto] })
  participants: GroupParticipantDto[];
}

export class CreateGroupResponseDto {
  @ApiProperty({ example: '123456789@g.us' })
  id: string;

  @ApiProperty({ example: '123456789@g.us' })
  gid: string;
}

export class InviteCodeResponseDto {
  @ApiProperty({ example: 'AbCdEfGhIjK' })
  inviteCode: string;

  @ApiProperty({ example: 'https://chat.whatsapp.com/AbCdEfGhIjK' })
  inviteLink: string;
}

export class GroupInfoByCodeResponseDto {
  @ApiProperty({ example: '123456789@g.us' })
  id: string;

  @ApiProperty({ example: 'Group Name' })
  subject: string;

  @ApiPropertyOptional({ example: 'Group description' })
  desc?: string;

  @ApiPropertyOptional({ example: 10 })
  size?: number;
}

export { SuccessResponseDto } from '../../../common/dto';

export class JoinGroupResponseDto {
  @ApiProperty({ example: '123456789@g.us' })
  groupId: string;
}

export class ParticipantsUpdateResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional()
  response?: unknown;
}
