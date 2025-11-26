import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsBoolean } from 'class-validator';

export class FetchHistoryDto {
  @ApiProperty({ description: 'Quantidade de mensagens a buscar', example: 50 })
  @IsNumber()
  count: number;

  @ApiProperty({ description: 'ID da mensagem mais antiga' })
  @IsString()
  @IsNotEmpty()
  oldestMsgId: string;

  @ApiProperty({ description: 'Se a mensagem mais antiga é do próprio usuário' })
  @IsBoolean()
  oldestMsgFromMe: boolean;

  @ApiProperty({ description: 'JID do chat da mensagem mais antiga' })
  @IsString()
  @IsNotEmpty()
  oldestMsgJid: string;

  @ApiProperty({ description: 'Timestamp da mensagem mais antiga (Unix)' })
  @IsNumber()
  oldestMsgTimestamp: number;
}
