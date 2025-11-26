import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class StarMessageDto {
  @ApiProperty({ description: 'ID da mensagem' })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({ description: 'true para favoritar, false para desfavoritar' })
  @IsBoolean()
  star: boolean;
}
