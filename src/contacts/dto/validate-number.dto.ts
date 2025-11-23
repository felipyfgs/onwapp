import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ValidateNumberDto {
  @ApiProperty({
    description: 'Lista de números de telefone para validar',
    example: ['5511999999999', '5521888888888'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  numbers: string[];
}
