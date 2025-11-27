import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ButtonDto {
  @ApiProperty({ description: 'Button ID' })
  @IsString()
  @IsNotEmpty()
  buttonId: string;

  @ApiProperty({ description: 'Button display text' })
  @IsString()
  @IsNotEmpty()
  displayText: string;
}

export class SendButtonsDto {
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

  @ApiProperty({ description: 'Buttons array', type: [ButtonDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ButtonDto)
  buttons: ButtonDto[];

  @ApiPropertyOptional({ description: 'Image URL for header' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
