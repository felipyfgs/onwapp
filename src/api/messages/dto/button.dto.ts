import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class ButtonTextDto {
  @ApiProperty({
    description: 'Texto do botão',
    example: 'Clique aqui',
  })
  @IsString()
  @IsNotEmpty()
  displayText: string;
}

export class ButtonDto {
  @ApiProperty({
    description: 'ID único do botão',
    example: 'btn1',
  })
  @IsString()
  @IsNotEmpty()
  buttonId: string;

  @ApiProperty({
    description: 'Texto do botão',
    type: ButtonTextDto,
  })
  @IsNotEmpty()
  buttonText: ButtonTextDto;

  @ApiProperty({
    description: 'Tipo do botão (sempre 1 para botões simples)',
    example: 1,
    default: 1,
  })
  @IsNumber()
  type: number;
}
