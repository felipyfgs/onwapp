import { ApiProperty } from '@nestjs/swagger';

export class SettingsResponseDto {
  @ApiProperty({
    description: 'Rejeitar chamadas automaticamente',
    example: true,
    required: false,
  })
  rejectCall?: boolean;

  @ApiProperty({
    description: 'Ignorar mensagens de grupos',
    example: false,
    required: false,
  })
  groupsIgnore?: boolean;

  @ApiProperty({
    description: 'Sempre mostrar como online',
    example: true,
    required: false,
  })
  alwaysOnline?: boolean;

  @ApiProperty({
    description: 'Marcar mensagens como lidas automaticamente',
    example: true,
    required: false,
  })
  readMessages?: boolean;

  @ApiProperty({
    description: 'Ler status automaticamente',
    example: false,
    required: false,
  })
  readStatus?: boolean;

  @ApiProperty({
    description: 'Sincronizar histórico completo',
    example: false,
    required: false,
  })
  syncFullHistory?: boolean;

  @ApiProperty({
    description: 'Privacidade da foto de perfil',
    example: 'all',
    required: false,
  })
  profilePicture?: string;

  @ApiProperty({
    description: 'Privacidade do status',
    example: 'contacts',
    required: false,
  })
  status?: string;

  @ApiProperty({
    description: 'Privacidade do visto por último',
    example: 'contacts',
    required: false,
  })
  lastSeen?: string;

  @ApiProperty({
    description: 'Privacidade do status online',
    example: 'all',
    required: false,
  })
  online?: string;

  @ApiProperty({
    description: 'Privacidade de chamadas',
    example: 'all',
    required: false,
  })
  call?: string;

  @ApiProperty({
    description: 'Privacidade de mensagens',
    example: 'all',
    required: false,
  })
  messages?: string;

  @ApiProperty({
    description: 'Privacidade de confirmações de leitura',
    example: 'all',
    required: false,
  })
  readReceipts?: string;

  @ApiProperty({
    description: 'Privacidade de adição a grupos',
    example: 'contacts',
    required: false,
  })
  groupsAdd?: string;
}
