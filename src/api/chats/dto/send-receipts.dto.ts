import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsIn,
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

  @ApiPropertyOptional({ description: 'Participant JID (for groups)' })
  @IsOptional()
  @IsString()
  participant?: string;
}

export class SendReceiptsDto {
  @ApiProperty({ description: 'Array of message keys', type: [MessageKeyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageKeyDto)
  keys: MessageKeyDto[];

  @ApiProperty({
    description: 'Receipt type',
    enum: ['read', 'read-self', 'played'],
  })
  @IsString()
  @IsIn(['read', 'read-self', 'played'])
  type: 'read' | 'read-self' | 'played';
}
