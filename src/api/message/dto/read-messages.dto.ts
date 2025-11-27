import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReadMessageKeyDto {
  @ApiProperty({ description: 'Remote JID (chat ID)' })
  @IsString()
  @IsNotEmpty()
  remoteJid: string;

  @ApiProperty({ description: 'Message ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({ description: 'Participant JID (for group messages)' })
  @IsOptional()
  @IsString()
  participant?: string;
}

export class ReadMessagesDto {
  @ApiProperty({
    description: 'Message keys to mark as read',
    type: [ReadMessageKeyDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReadMessageKeyDto)
  keys: ReadMessageKeyDto[];
}
