import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendDocumentDto {
  @ApiProperty({
    description: 'Phone number or WhatsApp ID',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Document URL or base64' })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiProperty({ description: 'Document mimetype', example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  mimetype: string;

  @ApiPropertyOptional({ description: 'File name', example: 'report.pdf' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ description: 'Document caption' })
  @IsOptional()
  @IsString()
  caption?: string;
}
