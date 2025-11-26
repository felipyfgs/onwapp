import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEmail } from 'class-validator';

export class UpdateBusinessProfileDto {
  @ApiPropertyOptional({ description: 'Descrição do negócio' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'E-mail do negócio' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Websites do negócio' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  website?: string[];

  @ApiPropertyOptional({ description: 'Categoria do negócio' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Endereço do negócio' })
  @IsString()
  @IsOptional()
  address?: string;
}
