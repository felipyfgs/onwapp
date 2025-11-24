import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { SendMessageBaseDto } from './send-message-base.dto';

export class SendLocationMessageDto extends SendMessageBaseDto {
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
    description: 'Nome do local',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Endereço',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({
    description: 'Visualização única',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  viewOnce?: boolean;
}
