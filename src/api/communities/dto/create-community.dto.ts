import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateCommunityDto {
  @ApiProperty({ description: 'Nome da comunidade' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({ description: 'Descrição da comunidade' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'IDs de grupos para vincular' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  linkedGroups?: string[];
}
