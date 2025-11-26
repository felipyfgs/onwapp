import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class UpdateNewsletterPictureDto {
  @ApiProperty({ description: 'URL da imagem' })
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  url: string;
}
