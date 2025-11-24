import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SendMessageBaseDto } from './send-message-base.dto';
import { ContactDto } from './contact.dto';

export class SendContactMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'Nome para exibição geral',
    required: false,
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({
    description: 'Lista de contatos',
    type: [ContactDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDto)
  contacts: ContactDto[];

  @ApiProperty({
    description: 'Visualização única',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  viewOnce?: boolean;
}
