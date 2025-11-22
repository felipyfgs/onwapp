import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { SendMessageBaseDto } from './send-message-base.dto';

export class SendVideoMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'URL do vídeo ou base64',
    example: 'https://example.com/video.mp4',
  })
  @IsString()
  @IsNotEmpty()
  video: string;

  @ApiProperty({
    description: 'Legenda do vídeo',
    required: false,
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({
    description: 'Reproduzir como GIF',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  gifPlayback?: boolean;

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
    description: 'Largura do vídeo',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiProperty({
    description: 'Altura do vídeo',
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
