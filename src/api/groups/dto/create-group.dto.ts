import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ArrayMinSize, IsNotEmpty } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Nome do grupo',
    example: 'Meu Grupo de Trabalho',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Lista de JIDs dos participantes',
    example: ['5511999999999@s.whatsapp.net', '5511988888888@s.whatsapp.net'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participants: string[];
}
