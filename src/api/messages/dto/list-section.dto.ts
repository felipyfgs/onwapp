import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ListRowDto } from './list-row.dto';

export class ListSectionDto {
  @ApiProperty({
    description: 'Título da seção',
    example: 'Seção 1',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Lista de opções',
    type: [ListRowDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListRowDto)
  rows: ListRowDto[];
}
