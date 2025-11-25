import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { SendMessageBaseDto } from './send-message-base.dto';

export class SendDocumentMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'URL do documento ou base64',
    example: 'https://example.com/document.pdf',
  })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiProperty({
    description: 'Tipo MIME do documento',
    example: 'application/pdf',
  })
  @IsString()
  @IsNotEmpty()
  mimetype: string;

  @ApiProperty({
    description: 'Nome do arquivo',
    required: false,
    example: 'documento.pdf',
  })
  @IsOptional()
  @IsString()
  fileName?: string;
}
