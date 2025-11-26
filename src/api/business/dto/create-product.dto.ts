import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
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

  @ApiProperty({ description: 'Descrição do produto' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Preço do produto (em centavos)' })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Código da moeda (ex: BRL)' })
  @IsString()
  @IsNotEmpty()
  currency: string;

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
    description: 'Código do país de origem (ISO)',
    example: 'BR',
  })
  @IsString()
  @IsOptional()
  originCountryCode?: string;

  @ApiProperty({ description: 'Imagens do produto', type: [ProductImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images: ProductImageDto[];
}
