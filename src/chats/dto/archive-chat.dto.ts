import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { LastMessage } from '../../common/interfaces/last-message.interface';
import { LastMessageDto } from '../../common/dto/last-message.dto';

export class ArchiveChatDto {
  @ApiProperty({
    description: 'Lista de últimas mensagens do chat (opcional)',
    type: [LastMessageDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LastMessageDto)
  lastMessages?: LastMessage[];
}
