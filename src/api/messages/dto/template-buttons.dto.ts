import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UrlButtonDto {
  @ApiProperty({
    description: 'Texto do botão',
    example: 'Visitar Site',
  })
  @IsString()
  @IsNotEmpty()
  displayText: string;

  @ApiProperty({
    description: 'URL a ser aberta',
    example: 'https://example.com',
  })
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class CallButtonDto {
  @ApiProperty({
    description: 'Texto do botão',
    example: 'Ligar',
  })
  @IsString()
  @IsNotEmpty()
  displayText: string;

  @ApiProperty({
    description: 'Número de telefone',
    example: '+5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

export class QuickReplyButtonDto {
  @ApiProperty({
    description: 'Texto do botão',
    example: 'Resposta Rápida',
  })
  @IsString()
  @IsNotEmpty()
  displayText: string;

  @ApiProperty({
    description: 'ID da resposta',
    example: 'reply1',
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}
