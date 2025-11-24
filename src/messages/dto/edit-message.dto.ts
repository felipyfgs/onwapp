import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SendMessageBaseDto } from './send-message-base.dto';
import { QuotedMessageDto } from './send-message-base.dto';

export class EditMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'Novo texto da mensagem',
    example: 'Texto editado',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Chave da mensagem a editar',
    type: QuotedMessageDto,
  })
  @ValidateNested()
  @Type(() => QuotedMessageDto)
  messageKey: QuotedMessageDto;
}
