import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class SendAudioDto {
  @ApiProperty({
    description: 'Phone number or WhatsApp ID',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Audio URL or base64' })
  @IsString()
  @IsNotEmpty()
  audio: string;

  @ApiPropertyOptional({
    description: 'Send as voice note (PTT)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  ptt?: boolean;

  @ApiPropertyOptional({ description: 'Audio mimetype', example: 'audio/mp4' })
  @IsOptional()
  @IsString()
  mimetype?: string;
}
