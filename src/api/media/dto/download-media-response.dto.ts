import { ApiProperty } from '@nestjs/swagger';

export class DownloadMediaResponseDto {
  @ApiProperty({
    description: 'Buffer da mídia em base64',
    example: '/9j/4AAQSkZJRgABAQAAAQABAAD...',
  })
  buffer: string;

  @ApiProperty({
    description: 'Tipo MIME do arquivo',
    example: 'image/jpeg',
    required: false,
  })
  mimetype?: string;

  @ApiProperty({
    description: 'Nome do arquivo',
    required: false,
  })
  fileName?: string;
}
