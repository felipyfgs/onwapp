import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UrlButtonDto {
  @ApiProperty({ description: 'Button display text' })
  @IsString()
  @IsNotEmpty()
  displayText: string;

  @ApiProperty({ description: 'URL to open' })
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class CallButtonDto {
  @ApiProperty({ description: 'Button display text' })
  @IsString()
  @IsNotEmpty()
  displayText: string;

  @ApiProperty({ description: 'Phone number to call' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

export class QuickReplyButtonDto {
  @ApiProperty({ description: 'Button display text' })
  @IsString()
  @IsNotEmpty()
  displayText: string;

  @ApiProperty({ description: 'Button ID for reply' })
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class TemplateButtonDto {
  @ApiProperty({ description: 'Button index (order)' })
  @IsNumber()
  index: number;

  @ApiPropertyOptional({ description: 'URL button config', type: UrlButtonDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UrlButtonDto)
  urlButton?: UrlButtonDto;

  @ApiPropertyOptional({
    description: 'Call button config',
    type: CallButtonDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CallButtonDto)
  callButton?: CallButtonDto;

  @ApiPropertyOptional({
    description: 'Quick reply button config',
    type: QuickReplyButtonDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuickReplyButtonDto)
  quickReplyButton?: QuickReplyButtonDto;
}

export class SendTemplateDto {
  @ApiProperty({
    description: 'Phone number or WhatsApp ID',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Message text' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ description: 'Message footer' })
  @IsOptional()
  @IsString()
  footer?: string;

  @ApiProperty({ description: 'Template buttons', type: [TemplateButtonDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateButtonDto)
  templateButtons: TemplateButtonDto[];

  @ApiPropertyOptional({ description: 'Image URL for header' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
