import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { SendMessageBaseDto } from './send-message-base.dto';

export class SendStickerMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'URL do sticker ou base64',
    example: 'https://example.com/sticker.webp',
  })
  @IsString()
  @IsNotEmpty()
  sticker: string;

  @ApiProperty({
    description: 'É sticker animado',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isAnimated?: boolean;

  @ApiProperty({
    description: 'Largura',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiProperty({
    description: 'Altura',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  height?: number;
}
