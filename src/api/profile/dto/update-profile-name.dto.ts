import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateProfileNameDto {
  @ApiProperty({
    description: 'Novo nome do perfil',
    example: 'João Silva',
    maxLength: 25,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  name: string;
}
