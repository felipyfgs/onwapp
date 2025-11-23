import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';

enum PictureType {
  IMAGE = 'image',
  PREVIEW = 'preview',
}

export class GetProfilePictureQueryDto {
  @ApiProperty({
    description: 'Tipo de imagem (image = alta resolução, preview = baixa)',
    enum: PictureType,
    required: false,
    default: 'preview',
  })
  @IsOptional()
  @IsEnum(PictureType)
  type?: 'image' | 'preview';

  @ApiProperty({
    description: 'Timeout em milissegundos',
    required: false,
    default: 10000,
  })
  @IsOptional()
  @IsInt()
  @Min(1000)
  timeout?: number;
}
