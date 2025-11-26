import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class MemberAddModeDto {
  @ApiProperty({
    description: 'Modo de adição de membros',
    enum: ['all_member_add', 'admin_add'],
  })
  @IsString()
  @IsIn(['all_member_add', 'admin_add'])
  mode: 'all_member_add' | 'admin_add';
}
