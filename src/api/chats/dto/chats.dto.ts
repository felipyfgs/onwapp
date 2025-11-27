import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class ChatJidDto {
  @ApiProperty({
    example: '5511999999999@s.whatsapp.net',
    description: 'Chat JID',
  })
  @IsString()
  @IsNotEmpty()
  jid: string;
}

export class ArchiveChatDto extends ChatJidDto {
  @ApiProperty({
    example: true,
    description: 'Archive (true) or unarchive (false)',
  })
  @IsBoolean()
  archive: boolean;
}

export class MuteChatDto extends ChatJidDto {
  @ApiPropertyOptional({
    example: 28800000,
    description: 'Mute duration in milliseconds (null to unmute)',
  })
  @IsNumber()
  @IsOptional()
  mute: number | null;
}

export class PinChatDto extends ChatJidDto {
  @ApiProperty({ example: true, description: 'Pin (true) or unpin (false)' })
  @IsBoolean()
  pin: boolean;
}

export class MarkReadDto extends ChatJidDto {
  @ApiProperty({
    example: true,
    description: 'Mark as read (true) or unread (false)',
  })
  @IsBoolean()
  read: boolean;
}

export { SuccessResponseDto } from '../../../common/dto';

export class DisappearingMessagesDto extends ChatJidDto {
  @ApiProperty({
    example: 604800,
    description:
      'Expiration time in seconds (604800 = 7 days, 86400 = 24h, 0 or false to disable)',
  })
  expiration: number | boolean;
}

export class StarMessageDto extends ChatJidDto {
  @ApiProperty({ description: 'Message ID to star/unstar' })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({ description: 'Star (true) or unstar (false)' })
  @IsBoolean()
  star: boolean;
}
