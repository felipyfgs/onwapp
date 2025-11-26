import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProductImageDto {
  @ApiPropertyOptional({ description: 'URL da imagem' })
  @IsString()
  url: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ description: 'Nome do produto' })
  @IsString()
  @IsOptional()
  name?: string;

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

  @ApiPropertyOptional({ description: 'Se o produto está oculto' })
  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;

  @ApiPropertyOptional({
    description: 'Imagens do produto',
    type: [ProductImageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @IsOptional()
  images?: ProductImageDto[];
}
