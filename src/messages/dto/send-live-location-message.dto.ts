import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SendMessageBaseDto } from './send-message-base.dto';

export class SendLiveLocationMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'Latitude',
    example: -23.5505199,
  })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    description: 'Longitude',
    example: -46.6333094,
  })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({
    description: 'Precisão em metros',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiProperty({
    description: 'Velocidade em m/s',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiProperty({
    description: 'Direção em graus do norte magnético',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  degreesClockwise?: number;

  @ApiProperty({
    description: 'Legenda',
    required: false,
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({
    description: 'Número de sequência',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sequenceNumber?: number;

  @ApiProperty({
    description: 'Offset de tempo',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  timeOffset?: number;

  @ApiProperty({
    description: 'Thumbnail JPEG em base64',
    required: false,
  })
  @IsOptional()
  @IsString()
  jpegThumbnail?: string;
}
