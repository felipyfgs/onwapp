import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateNewsletterDto {
  @ApiProperty({ description: 'Nome do canal', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do canal', maxLength: 2048 })
  @IsString()
  @IsOptional()
  @MaxLength(2048)
  description?: string;
}
