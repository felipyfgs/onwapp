import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetCatalogDto {
  @ApiPropertyOptional({
    example: '5511999999999',
    description: 'Business JID (optional, defaults to own catalog)',
  })
  @IsString()
  @IsOptional()
  jid?: string;

  @ApiPropertyOptional({
    example: 50,
    description: 'Maximum number of products to return',
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;
}

export class GetCollectionsDto {
  @ApiPropertyOptional({
    example: '5511999999999',
    description: 'Business JID (optional, defaults to own collections)',
  })
  @IsString()
  @IsOptional()
  jid?: string;

  @ApiPropertyOptional({
    example: 50,
    description: 'Maximum number of collections to return',
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;
}

export class GetOrderDetailsDto {
  @ApiProperty({
    example: 'ORDER123456',
    description: 'Order ID',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    example: 'base64encodedtoken',
    description: 'Order token (base64 encoded)',
  })
  @IsString()
  @IsNotEmpty()
  tokenBase64: string;
}

export class ProductImageDto {
  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'Image URL',
  })
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class ProductCreateDto {
  @ApiProperty({ example: 'Product Name', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Product description',
    description: 'Product description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'BRL', description: 'Currency code (ISO 4217)' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    example: 1999,
    description: 'Price in cents (e.g., 1999 = R$19.99)',
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: 'https://example.com/product',
    description: 'Product URL',
  })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({
    example: 'SKU123',
    description: 'Product SKU/retailer ID',
  })
  @IsString()
  @IsOptional()
  retailerId?: string;

  @ApiPropertyOptional({
    type: [ProductImageDto],
    description: 'Product images',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];
}

export class ProductUpdateDto {
  @ApiProperty({ example: 'PROD123', description: 'Product ID to update' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ example: 'Updated Name', description: 'New name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated description',
    description: 'New description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 2499,
    description: 'New price in cents',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    example: 'BRL',
    description: 'Currency code',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/product',
    description: 'New product URL',
  })
  @IsString()
  @IsOptional()
  url?: string;
}

export class ProductDeleteDto {
  @ApiProperty({
    example: ['PROD123', 'PROD456'],
    description: 'Array of product IDs to delete',
  })
  @IsArray()
  @IsString({ each: true })
  productIds: string[];
}

export { SuccessResponseDto } from '../../../common/dto';
