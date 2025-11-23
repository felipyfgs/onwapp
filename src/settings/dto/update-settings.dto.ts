import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import {
  WAPrivacyValue,
  WAPrivacyOnlineValue,
  WAPrivacyCallValue,
  WAPrivacyMessagesValue,
  WAReadReceiptsValue,
  WAPrivacyGroupAddValue,
} from '../../common/constants/privacy.enum';

export class UpdateSettingsDto {
  @ApiProperty({
    description: 'Rejeitar chamadas automaticamente',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  rejectCall?: boolean;

  @ApiProperty({
    description: 'Ignorar mensagens de grupos',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  groupsIgnore?: boolean;

  @ApiProperty({
    description: 'Sempre mostrar como online',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  alwaysOnline?: boolean;

  @ApiProperty({
    description: 'Marcar mensagens como lidas automaticamente',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readMessages?: boolean;

  @ApiProperty({
    description: 'Ler status automaticamente',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  readStatus?: boolean;

  @ApiProperty({
    description: 'Sincronizar histórico completo',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  syncFullHistory?: boolean;

  @ApiProperty({
    description: 'Privacidade da foto de perfil',
    enum: WAPrivacyValue,
    required: false,
    example: 'all',
  })
  @IsOptional()
  @IsEnum(WAPrivacyValue)
  profilePicture?: WAPrivacyValue;

  @ApiProperty({
    description: 'Privacidade do status',
    enum: WAPrivacyValue,
    required: false,
    example: 'contacts',
  })
  @IsOptional()
  @IsEnum(WAPrivacyValue)
  status?: WAPrivacyValue;

  @ApiProperty({
    description: 'Privacidade do visto por último',
    enum: WAPrivacyValue,
    required: false,
    example: 'contacts',
  })
  @IsOptional()
  @IsEnum(WAPrivacyValue)
  lastSeen?: WAPrivacyValue;

  @ApiProperty({
    description: 'Privacidade do status online',
    enum: WAPrivacyOnlineValue,
    required: false,
    example: 'all',
  })
  @IsOptional()
  @IsEnum(WAPrivacyOnlineValue)
  online?: WAPrivacyOnlineValue;

  @ApiProperty({
    description: 'Privacidade de chamadas',
    enum: WAPrivacyCallValue,
    required: false,
    example: 'all',
  })
  @IsOptional()
  @IsEnum(WAPrivacyCallValue)
  call?: WAPrivacyCallValue;

  @ApiProperty({
    description: 'Privacidade de mensagens',
    enum: WAPrivacyMessagesValue,
    required: false,
    example: 'all',
  })
  @IsOptional()
  @IsEnum(WAPrivacyMessagesValue)
  messages?: WAPrivacyMessagesValue;

  @ApiProperty({
    description: 'Privacidade de confirmações de leitura',
    enum: WAReadReceiptsValue,
    required: false,
    example: 'all',
  })
  @IsOptional()
  @IsEnum(WAReadReceiptsValue)
  readReceipts?: WAReadReceiptsValue;

  @ApiProperty({
    description: 'Privacidade de adição a grupos',
    enum: WAPrivacyGroupAddValue,
    required: false,
    example: 'contacts',
  })
  @IsOptional()
  @IsEnum(WAPrivacyGroupAddValue)
  groupsAdd?: WAPrivacyGroupAddValue;
}
