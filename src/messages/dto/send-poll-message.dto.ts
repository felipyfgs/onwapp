import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { SendMessageBaseDto } from './send-message-base.dto';

export class SendPollMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'Pergunta da enquete',
    example: 'Qual sua cor favorita?',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Opções da enquete (2-12 opções)',
    type: [String],
    example: ['Azul', 'Vermelho', 'Verde', 'Amarelo'],
  })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({
    description: 'Número de opções selecionáveis (0 = múltipla escolha, 1+ = escolha única/limitada)',
    required: false,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(12)
  selectableCount?: number;
}
