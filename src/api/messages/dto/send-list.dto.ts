import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListRowDto {
  @ApiProperty({ description: 'Row title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Row ID' })
  @IsString()
  @IsNotEmpty()
  rowId: string;

  @ApiPropertyOptional({ description: 'Row description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ListSectionDto {
  @ApiProperty({ description: 'Section title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Section rows', type: [ListRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListRowDto)
  rows: ListRowDto[];
}

export class SendListDto {
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

  @ApiProperty({ description: 'List title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Button text to open list' })
  @IsString()
  @IsNotEmpty()
  buttonText: string;

  @ApiProperty({ description: 'List sections', type: [ListSectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListSectionDto)
  sections: ListSectionDto[];
}
