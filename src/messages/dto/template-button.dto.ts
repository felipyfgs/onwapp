import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  UrlButtonDto,
  CallButtonDto,
  QuickReplyButtonDto,
} from './template-buttons.dto';

export class TemplateButtonDto {
  @ApiProperty({
    description: 'Índice do botão (sequencial)',
    example: 1,
  })
  @IsNumber()
  index: number;

  @ApiProperty({
    description: 'Botão de URL',
    type: UrlButtonDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UrlButtonDto)
  urlButton?: UrlButtonDto;

  @ApiProperty({
    description: 'Botão de chamada',
    type: CallButtonDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CallButtonDto)
  callButton?: CallButtonDto;

  @ApiProperty({
    description: 'Botão de resposta rápida',
    type: QuickReplyButtonDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuickReplyButtonDto)
  quickReplyButton?: QuickReplyButtonDto;
}
