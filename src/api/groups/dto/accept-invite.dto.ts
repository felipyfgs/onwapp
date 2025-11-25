import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AcceptInviteDto {
  @ApiProperty({
    description: 'Código do convite do grupo',
    example: 'ABCdefGHIjklMNO123',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
