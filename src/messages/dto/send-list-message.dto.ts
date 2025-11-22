import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SendMessageBaseDto } from './send-message-base.dto';
import { ListSectionDto } from './list-section.dto';

export class SendListMessageDto extends SendMessageBaseDto {
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
    description: 'Título da lista',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Texto do botão para abrir a lista',
    example: 'Ver opções',
  })
  @IsString()
  @IsNotEmpty()
  buttonText: string;

  @ApiProperty({
    description: 'Seções da lista',
    type: [ListSectionDto],
    example: [
      {
        title: 'Seção 1',
        rows: [
          { title: 'Opção 1', rowId: 'row1', description: 'Descrição 1' },
          { title: 'Opção 2', rowId: 'row2' },
        ],
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListSectionDto)
  sections: ListSectionDto[];
}
