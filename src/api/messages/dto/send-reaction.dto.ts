import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageKeyDto {
  @ApiProperty({ description: 'Remote JID' })
  @IsString()
  @IsNotEmpty()
  remoteJid: string;

  @ApiProperty({ description: 'Message ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'From me flag' })
  fromMe: boolean;
}

export class SendReactionDto {
  @ApiProperty({
    description: 'Phone number or WhatsApp ID',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Emoji reaction (empty string to remove)',
    example: '👍',
  })
  @IsString()
  emoji: string;

  @ApiProperty({ description: 'Message key to react to', type: MessageKeyDto })
  @ValidateNested()
  @Type(() => MessageKeyDto)
  messageKey: MessageKeyDto;
}
