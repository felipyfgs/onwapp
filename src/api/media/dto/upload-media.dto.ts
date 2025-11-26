import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UploadMediaDto {
  @ApiProperty({
    description: 'File path on server to upload',
    example: '/tmp/media/image.png',
  })
  @IsString()
  filePath: string;

  @ApiProperty({
    description: 'Media type',
    enum: ['image', 'video', 'audio', 'document', 'sticker'],
  })
  @IsString()
  @IsIn(['image', 'video', 'audio', 'document', 'sticker'])
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker';

  @ApiProperty({
    description: 'File encryption SHA256 in base64',
  })
  @IsString()
  fileEncSha256B64: string;
}
