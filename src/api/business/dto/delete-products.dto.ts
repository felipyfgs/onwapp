import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class DeleteProductsDto {
  @ApiProperty({ description: 'IDs dos produtos a deletar' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  productIds: string[];
}
