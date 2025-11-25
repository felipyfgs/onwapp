import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateProfileStatusDto {
  @ApiProperty({
    description: 'Novo status do perfil',
    example: 'Hey there! I am using WhatsApp',
    maxLength: 139,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(139)
  status: string;
}
