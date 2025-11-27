import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageKeyDto {
  @ApiProperty({ example: 'ABCD1234', description: 'Message ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: true, description: 'Whether the message is from you' })
  @IsBoolean()
  fromMe: boolean;

  @ApiProperty({
    example: '5511999999999@s.whatsapp.net',
    description: 'Remote JID (chat ID)',
  })
  @IsString()
  @IsNotEmpty()
  remoteJid: string;
}

export class EditMessageDto {
  @ApiProperty({
    example: '5511999999999',
    description: 'Recipient phone number or JID',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    type: MessageKeyDto,
    description: 'Key of the message to edit',
  })
  @ValidateNested()
  @Type(() => MessageKeyDto)
  messageKey: MessageKeyDto;

  @ApiProperty({
    example: 'This is the edited message text',
    description: 'New text content',
  })
  @IsString()
  @IsNotEmpty()
  newText: string;
}
