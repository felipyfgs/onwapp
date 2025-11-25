import { ApiProperty } from '@nestjs/swagger';

export class BusinessProfileResponseDto {
  @ApiProperty({ description: 'JID do contato de negócio' })
  jid: string;

  @ApiProperty({
    description: 'Descrição do negócio',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Categoria do negócio',
    required: false,
  })
  category?: string;

  @ApiProperty({
    description: 'Email do negócio',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'Website do negócio',
    required: false,
  })
  website?: string;
}
