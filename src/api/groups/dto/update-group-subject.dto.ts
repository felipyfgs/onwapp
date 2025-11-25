import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateGroupSubjectDto {
  @ApiProperty({
    description: 'Novo nome do grupo',
    example: 'Novo Nome do Grupo',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;
}
