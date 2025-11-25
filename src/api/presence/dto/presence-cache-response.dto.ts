import { ApiProperty } from '@nestjs/swagger';

export class PresenceDataDto {
  @ApiProperty({
    description: 'JID do contato',
    example: '5511999999999@s.whatsapp.net',
  })
  jid: string;

  @ApiProperty({
    description: 'Tipo de presença',
    example: 'available',
  })
  presence: string;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-01T12:00:00Z',
  })
  lastUpdate: Date;

  @ApiProperty({
    description: 'Timestamp do último visto (opcional)',
    required: false,
  })
  lastSeen?: number;
}

export class PresenceCacheResponseDto {
  @ApiProperty({
    description: 'Lista de presenças em cache',
    type: [PresenceDataDto],
  })
  presences: PresenceDataDto[];
}
