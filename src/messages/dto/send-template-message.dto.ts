import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SendMessageBaseDto } from './send-message-base.dto';
import { TemplateButtonDto } from './template-button.dto';

export class SendTemplateMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'Texto da mensagem',
    example: 'Confira nossas opções:',
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
    description: 'Lista de template buttons',
    type: [TemplateButtonDto],
    example: [
      { index: 1, urlButton: { displayText: 'Visitar', url: 'https://example.com' } },
      { index: 2, callButton: { displayText: 'Ligar', phoneNumber: '+5511999999999' } },
      { index: 3, quickReplyButton: { displayText: 'Responder', id: 'reply1' } },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateButtonDto)
  templateButtons: TemplateButtonDto[];

  @ApiProperty({
    description: 'Imagem anexa (URL ou base64)',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;
}
