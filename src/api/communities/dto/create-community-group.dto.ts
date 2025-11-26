import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateCommunityGroupDto {
  @ApiProperty({ description: 'Nome do grupo' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({ description: 'Participantes iniciais' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  participants?: string[];
}
