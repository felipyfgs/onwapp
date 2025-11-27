import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InviteMessageDto {
  @ApiProperty({ description: 'Group JID' })
  @IsString()
  @IsNotEmpty()
  groupJid: string;

  @ApiProperty({ description: 'Invite code' })
  @IsString()
  @IsNotEmpty()
  inviteCode: string;

  @ApiProperty({ description: 'Invite expiration timestamp' })
  @IsNumber()
  inviteExpiration: number;

  @ApiPropertyOptional({ description: 'Group name' })
  @IsOptional()
  @IsString()
  groupName?: string;
}

export class AcceptInviteV4Dto {
  @ApiProperty({
    description: 'Sender JID who sent the invite message',
    example: '5511999999999@s.whatsapp.net',
  })
  @IsString()
  @IsNotEmpty()
  senderId: string;

  @ApiProperty({
    description: 'Invite message details',
    type: InviteMessageDto,
  })
  @ValidateNested()
  @Type(() => InviteMessageDto)
  inviteMessage: InviteMessageDto;
}
