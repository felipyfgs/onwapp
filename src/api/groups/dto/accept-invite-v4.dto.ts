import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class AcceptInviteV4Dto {
  @ApiProperty({ description: 'ID da mensagem de convite' })
  @IsString()
  @IsNotEmpty()
  keyId: string;

  @ApiProperty({ description: 'JID de quem enviou o convite' })
  @IsString()
  @IsNotEmpty()
  keyRemoteJid: string;

  @ApiProperty({ description: 'Se a mensagem é do próprio usuário' })
  @IsBoolean()
  keyFromMe: boolean;

  @ApiProperty({ description: 'Código do convite' })
  @IsString()
  @IsNotEmpty()
  inviteCode: string;

  @ApiProperty({ description: 'Timestamp de expiração do convite' })
  @IsNumber()
  inviteExpiration: number;

  @ApiProperty({ description: 'JID do grupo' })
  @IsString()
  @IsNotEmpty()
  groupJid: string;

  @ApiPropertyOptional({ description: 'Nome do grupo' })
  @IsString()
  @IsOptional()
  groupName?: string;
}
