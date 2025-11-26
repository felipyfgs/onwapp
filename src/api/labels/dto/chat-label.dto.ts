import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ChatLabelDto {
  @ApiProperty({ description: 'JID do chat' })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({ description: 'ID da label' })
  @IsString()
  @IsNotEmpty()
  labelId: string;
}
