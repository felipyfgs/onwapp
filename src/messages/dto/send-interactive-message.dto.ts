import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { SendMessageBaseDto } from './send-message-base.dto';

export class SendInteractiveMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'Mensagem interativa (proto.Message.IInteractiveMessage)',
    example: {
      header: { title: 'Título' },
      body: { text: 'Corpo da mensagem' },
      footer: { text: 'Rodapé' },
    },
  })
  interactiveMessage: any;

  @ApiProperty({
    description: 'Visualização única',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  viewOnce?: boolean;
}
