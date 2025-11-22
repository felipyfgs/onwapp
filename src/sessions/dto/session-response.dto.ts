import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty({
    description: 'ID único da sessão',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da sessão',
    example: 'Minha Sessão WhatsApp',
  })
  name: string;

  @ApiProperty({
    description: 'Status da sessão',
    example: 'connected',
    enum: ['connected', 'disconnected', 'connecting', 'qr'],
  })
  status: string;

  @ApiProperty({
    description: 'Código QR para pareamento',
    required: false,
    example: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
  })
  qrCode?: string;

  @ApiProperty({
    description: 'Número de telefone pareado',
    required: false,
    example: '+5511999999999',
  })
  phoneNumber?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-11-22T19:07:27.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-11-22T19:07:27.000Z',
  })
  updatedAt: Date;
}
