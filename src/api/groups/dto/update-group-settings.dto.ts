import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateGroupSettingsDto {
  @ApiProperty({
    description: 'Apenas admins podem enviar mensagens',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  announcementMode?: boolean;

  @ApiProperty({
    description: 'Apenas admins podem editar informações do grupo',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  locked?: boolean;
}
