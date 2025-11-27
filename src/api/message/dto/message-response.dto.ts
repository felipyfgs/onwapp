import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageKeyResponseDto {
  @ApiProperty()
  remoteJid: string;

  @ApiProperty()
  fromMe: boolean;

  @ApiProperty()
  id: string;
}

export class MessageResponseDto {
  @ApiProperty({ type: MessageKeyResponseDto })
  key: MessageKeyResponseDto;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  messageTimestamp?: number;
}
