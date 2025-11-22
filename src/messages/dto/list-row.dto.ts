import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ListRowDto {
  @ApiProperty({
    description: 'Título da opção',
    example: 'Opção 1',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'ID único da opção',
    example: 'row1',
  })
  @IsString()
  @IsNotEmpty()
  rowId: string;

  @ApiProperty({
    description: 'Descrição da opção',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
