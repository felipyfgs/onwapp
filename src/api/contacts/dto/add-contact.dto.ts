import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddContactDto {
  @ApiProperty({ description: 'JID do contato' })
  @IsString()
  @IsNotEmpty()
  jid: string;

  @ApiProperty({ description: 'Nome do contato' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
