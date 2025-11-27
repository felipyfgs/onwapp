import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageKeyDto } from './send-reaction.dto';

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
