import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class StarMessageDto {
  @ApiProperty({ description: 'ID da mensagem' })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({ description: 'True para favoritar, false para desfavoritar' })
  @IsBoolean()
  star: boolean;
}
