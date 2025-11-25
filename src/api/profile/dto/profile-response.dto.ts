import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({
    description: 'JID do usuário',
    example: '5511999999999@s.whatsapp.net',
  })
  jid?: string;

  @ApiProperty({
    description: 'Nome do perfil',
    example: 'João Silva',
  })
  name?: string;

  @ApiProperty({
    description: 'Status do perfil',
    example: 'Hey there! I am using WhatsApp',
  })
  status?: string;

  @ApiProperty({
    description: 'URL da foto de perfil',
    required: false,
  })
  profilePictureUrl?: string;
}
