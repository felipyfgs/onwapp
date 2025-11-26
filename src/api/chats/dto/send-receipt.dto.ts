import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsIn,
  ArrayMinSize,
} from 'class-validator';

export class SendReceiptDto {
  @ApiProperty({ description: 'JID do chat' })
  @IsString()
  @IsNotEmpty()
  jid: string;

  @ApiPropertyOptional({ description: 'JID do participante (para grupos)' })
  @IsString()
  @IsOptional()
  participant?: string;

  @ApiProperty({ description: 'IDs das mensagens' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  messageIds: string[];

  @ApiProperty({
    description: 'Tipo de recibo',
    enum: ['read', 'read-self', 'played'],
  })
  @IsString()
  @IsIn(['read', 'read-self', 'played'])
  type: 'read' | 'read-self' | 'played';
}
