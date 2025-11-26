import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsUrl, IsOptional } from 'class-validator';

export class UpdateNewsletterNameDto {
  @ApiProperty({ description: 'Novo nome do canal', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
}

export class UpdateNewsletterDescriptionDto {
  @ApiProperty({ description: 'Nova descrição do canal', maxLength: 2048 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  description: string;
}

export class UpdateNewsletterPictureDto {
  @ApiProperty({ description: 'URL da imagem' })
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

export class ReactNewsletterMessageDto {
  @ApiProperty({ description: 'ID do servidor da mensagem' })
  @IsString()
  @IsNotEmpty()
  serverId: string;

  @ApiProperty({ description: 'Emoji de reação (vazio para remover)' })
  @IsString()
  @IsOptional()
  reaction?: string;
}
