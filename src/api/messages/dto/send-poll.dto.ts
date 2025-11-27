import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class SendPollDto {
  @ApiProperty({
    example: '5511999999999',
    description: 'Recipient phone number or JID',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    example: 'What is your favorite color?',
    description: 'Poll question/name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: ['Red', 'Blue', 'Green', 'Yellow'],
    description: 'Poll options (minimum 2)',
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @ApiPropertyOptional({
    example: 1,
    description: 'Number of options user can select (default: 1)',
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(12)
  selectableCount?: number;
}
