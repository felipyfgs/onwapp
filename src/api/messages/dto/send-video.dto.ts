import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class SendVideoDto {
  @ApiProperty({
    description: 'Phone number or WhatsApp ID',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Video URL or base64' })
  @IsString()
  @IsNotEmpty()
  video: string;

  @ApiPropertyOptional({ description: 'Video caption' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ description: 'Send as GIF', default: false })
  @IsOptional()
  @IsBoolean()
  gifPlayback?: boolean;
}
