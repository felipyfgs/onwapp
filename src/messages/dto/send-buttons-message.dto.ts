import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SendMessageBaseDto } from './send-message-base.dto';
import { ButtonDto } from './button.dto';

export class SendButtonsMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'Texto da mensagem',
    example: 'Escolha uma opção:',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Rodapé da mensagem',
    required: false,
  })
  @IsOptional()
  @IsString()
  footer?: string;

  @ApiProperty({
    description: 'Lista de botões (máximo 3)',
    type: [ButtonDto],
    example: [
      { buttonId: 'btn1', buttonText: { displayText: 'Opção 1' }, type: 1 },
      { buttonId: 'btn2', buttonText: { displayText: 'Opção 2' }, type: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ButtonDto)
  buttons: ButtonDto[];

  @ApiProperty({
    description: 'Tipo de cabeçalho (1 = texto, 4 = imagem)',
    required: false,
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  headerType?: number;

  @ApiProperty({
    description: 'Imagem para o cabeçalho (URL ou base64)',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;
}
