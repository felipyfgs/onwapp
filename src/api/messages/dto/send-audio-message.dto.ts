import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { SendMessageBaseDto } from './send-message-base.dto';

export class SendAudioMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'URL do áudio ou base64',
    example: 'https://example.com/audio.mp3',
  })
  @IsString()
  @IsNotEmpty()
  audio: string;

  @ApiProperty({
    description: 'É nota de voz (PTT)',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  ptt?: boolean;

  @ApiProperty({
    description: 'Duração em segundos',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  seconds?: number;

  @ApiProperty({
    description: 'Tipo MIME',
    required: false,
  })
  @IsOptional()
  @IsString()
  mimetype?: string;

  @ApiProperty({
    description:
      'Converter áudio para OGG/OPUS (PTT). Default: true. Se false, envia sem conversão.',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  encoding?: boolean;
}
