import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CarouselButtonDto {
  @ApiProperty({
    description: 'Button type: quick_reply, cta_url, cta_call',
    example: 'cta_url',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Button parameters as JSON string',
    example: '{"display_text":"Visit","url":"https://google.com"}',
  })
  @IsString()
  @IsNotEmpty()
  buttonParamsJson: string;
}

export class CarouselCardDto {
  @ApiPropertyOptional({
    description: 'Image URL for the card',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Video URL for the card',
    example: 'https://example.com/video.mp4',
  })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiProperty({ description: 'Card title', example: 'Product 1' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Card body text', example: 'Description here' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ description: 'Card footer', example: 'R$ 99,90' })
  @IsString()
  @IsOptional()
  footer?: string;

  @ApiProperty({
    description: 'Buttons for this card',
    type: [CarouselButtonDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarouselButtonDto)
  buttons: CarouselButtonDto[];
}

export class SendCarouselDto {
  @ApiProperty({
    description: 'Phone number or WhatsApp ID',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Message body text', example: 'Choose a product' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ description: 'Message title', example: 'Our Products' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Message footer', example: 'Swipe to see more' })
  @IsString()
  @IsOptional()
  footer?: string;

  @ApiProperty({
    description: 'Array of carousel cards',
    type: [CarouselCardDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarouselCardDto)
  cards: CarouselCardDto[];
}
