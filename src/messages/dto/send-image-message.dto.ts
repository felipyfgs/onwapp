import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { SendMessageBaseDto } from './send-message-base.dto';

export class SendImageMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'URL da imagem ou base64',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({
    description: 'Legenda da imagem',
    required: false,
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({
    description: 'Thumbnail JPEG em base64',
    required: false,
  })
  @IsOptional()
  @IsString()
  jpegThumbnail?: string;

  @ApiProperty({
    description: 'JIDs mencionados na legenda',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @ApiProperty({
    description: 'Largura da imagem',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiProperty({
    description: 'Altura da imagem',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({
    description: 'Visualização única',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  viewOnce?: boolean;

  @ApiProperty({
    description: 'Tipo MIME',
    required: false,
  })
  @IsOptional()
  @IsString()
  mimetype?: string;
}
