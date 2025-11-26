import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProductImageDto {
  @ApiProperty({ description: 'URL da imagem' })
  @IsString()
  url: string;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Nome do produto' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do produto' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Preço do produto (em centavos)' })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'Código da moeda (ex: BRL)' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'URL do produto' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'ID do varejista' })
  @IsString()
  @IsOptional()
  retailerId?: string;

  @ApiPropertyOptional({ description: 'Imagens do produto', type: [ProductImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @IsOptional()
  images?: ProductImageDto[];
}
