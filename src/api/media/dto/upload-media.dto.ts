import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';

export class UploadMediaDto {
  @ApiProperty({
    description: 'Base64 encoded media content',
    example: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  })
  @IsString()
  base64: string;

  @ApiProperty({
    description: 'Media type',
    enum: ['image', 'video', 'audio', 'document', 'sticker'],
  })
  @IsString()
  @IsIn(['image', 'video', 'audio', 'document', 'sticker'])
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker';

  @ApiPropertyOptional({
    description: 'MIME type of the file',
    example: 'image/png',
  })
  @IsOptional()
  @IsString()
  mimetype?: string;

  @ApiPropertyOptional({
    description: 'File encryption SHA256 in base64 (for re-uploads)',
  })
  @IsOptional()
  @IsString()
  fileEncSha256B64?: string;
}
