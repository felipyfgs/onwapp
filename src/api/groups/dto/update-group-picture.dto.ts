import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, ValidateIf } from 'class-validator';

export class UpdateGroupPictureDto {
  @ApiProperty({
    description: 'URL da imagem',
    example: 'https://exemplo.com/imagem.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.buffer)
  url?: string;

  @ApiProperty({
    description: 'Buffer da imagem em base64',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    required: false,
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.url)
  buffer?: string;
}
