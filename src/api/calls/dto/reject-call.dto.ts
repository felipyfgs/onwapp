import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RejectCallDto {
  @ApiProperty({ description: 'ID da chamada' })
  @IsString()
  @IsNotEmpty()
  callId: string;

  @ApiProperty({ description: 'JID de quem está ligando' })
  @IsString()
  @IsNotEmpty()
  callFrom: string;
}
