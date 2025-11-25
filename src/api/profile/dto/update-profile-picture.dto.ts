import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateProfilePictureDto {
  @ApiProperty({
    description:
      'Imagem em base64 ou URL da imagem para definir como foto de perfil',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsString()
  @IsNotEmpty()
  image: string;
}
