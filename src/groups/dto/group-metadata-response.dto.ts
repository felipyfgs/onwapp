import { ApiProperty } from '@nestjs/swagger';

export class GroupParticipant {
  @ApiProperty({ example: '5511999999999@s.whatsapp.net' })
  id: string;

  @ApiProperty({ example: false })
  admin?: boolean | 'superadmin';

  @ApiProperty({ example: false })
  isSuperAdmin?: boolean;
}

export class GroupMetadataResponseDto {
  @ApiProperty({ example: '123456789-123345@g.us' })
  id: string;

  @ApiProperty({ example: 'Meu Grupo' })
  subject: string;

  @ApiProperty({ example: 1234567890 })
  creation: number;

  @ApiProperty({ example: '5511999999999@s.whatsapp.net' })
  owner?: string;

  @ApiProperty({ example: 'Descrição do grupo', required: false })
  desc?: string;

  @ApiProperty({ type: [GroupParticipant] })
  participants: GroupParticipant[];

  @ApiProperty({ example: 1234567890, required: false })
  descTime?: number;

  @ApiProperty({ example: '5511999999999@s.whatsapp.net', required: false })
  descOwner?: string;

  @ApiProperty({ example: false, required: false })
  restrict?: boolean;

  @ApiProperty({ example: false, required: false })
  announce?: boolean;

  @ApiProperty({ example: 0, required: false })
  size?: number;
}
