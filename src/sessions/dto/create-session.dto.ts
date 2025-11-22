import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    description: 'Nome da sessão',
    example: 'Minha Sessão WhatsApp',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
