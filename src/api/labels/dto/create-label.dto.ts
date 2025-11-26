import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class CreateLabelDto {
  @ApiProperty({ description: 'Nome da label' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Cor da label (0-19)', minimum: 0, maximum: 19 })
  @IsNumber()
  @Min(0)
  @Max(19)
  color: number;
}
