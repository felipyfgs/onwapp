import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateGroupDescriptionDto {
  @ApiProperty({
    description: 'Nova descrição do grupo (vazio para remover)',
    example: 'Descrição do grupo de trabalho',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
