import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MessageKeyDto {
  @ApiProperty({ description: 'Message ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Remote JID' })
  @IsString()
  remoteJid: string;

  @ApiPropertyOptional({ description: 'Whether message is from me' })
  @IsOptional()
  @IsBoolean()
  fromMe?: boolean;
}

class PlaceholderMessageDto {
  @ApiProperty({ description: 'Message key', type: MessageKeyDto })
  @ValidateNested()
  @Type(() => MessageKeyDto)
  messageKey: MessageKeyDto;
}

export class RequestPlaceholderResendDto {
  @ApiProperty({
    description: 'Array of message keys to resend',
    type: [PlaceholderMessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaceholderMessageDto)
  messageKeys: PlaceholderMessageDto[];
}
