import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class JoinApprovalModeDto {
  @ApiProperty({
    description: 'Modo de aprovação de entrada',
    enum: ['on', 'off'],
  })
  @IsString()
  @IsIn(['on', 'off'])
  mode: 'on' | 'off';
}
