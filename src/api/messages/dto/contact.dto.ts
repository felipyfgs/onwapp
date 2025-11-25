import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ContactDto {
  @ApiProperty({
    description: 'Nome para exibição',
    required: false,
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({
    description: 'vCard do contato',
    example:
      'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+5511999999999\nEND:VCARD',
  })
  @IsString()
  @IsNotEmpty()
  vcard: string;
}
