import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class SendLocationDto {
  @ApiProperty({
    description: 'Phone number or WhatsApp ID',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Latitude', example: -23.5505 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: -46.6333 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ description: 'Location name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Location address' })
  @IsOptional()
  @IsString()
  address?: string;
}
