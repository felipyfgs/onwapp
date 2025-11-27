import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';

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

export class ProductCreateDto {
  @ApiProperty({ example: 'Product Name', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Product description',
    description: 'Product description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

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
    example: 'BR',
    description: 'ISO country code for product origin (or undefined for no country)',
  })
  @IsString()
  @IsOptional()
  originCountryCode?: string;

  @ApiProperty({
    example: [{ url: 'https://example.com/image.jpg' }],
    description: 'Product images as WAMediaUpload array',
  })
  @IsArray()
  images: { url: string }[];

  @ApiPropertyOptional({
    example: false,
    description: 'Whether product is hidden',
  })
  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;
}

export class ProductUpdateDto {
  @ApiProperty({ example: 'PROD123', description: 'Product ID to update' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'Updated Name', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Updated description',
    description: 'Product description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 2499,
    description: 'Price in cents',
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 'BRL',
    description: 'Currency code',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    example: [{ url: 'https://example.com/image.jpg' }],
    description: 'Product images',
  })
  @IsArray()
  images: { url: string }[];

  @ApiPropertyOptional({
    example: 'https://example.com/product',
    description: 'Product URL',
  })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({
    example: 'SKU123',
    description: 'Retailer ID',
  })
  @IsString()
  @IsOptional()
  retailerId?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether product is hidden',
  })
  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;
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
