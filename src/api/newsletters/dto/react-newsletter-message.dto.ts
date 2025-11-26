import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ReactNewsletterMessageDto {
  @ApiProperty({ description: 'ID do servidor da mensagem' })
  @IsString()
  @IsNotEmpty()
  serverId: string;

  @ApiPropertyOptional({ description: 'Emoji de reação (vazio para remover)' })
  @IsString()
  @IsOptional()
  reaction?: string;
}
