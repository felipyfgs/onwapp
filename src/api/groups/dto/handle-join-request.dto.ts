import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsIn, ArrayMinSize } from 'class-validator';

export class HandleJoinRequestDto {
  @ApiProperty({
    description: 'Lista de JIDs dos participantes',
    example: ['5511999999999@s.whatsapp.net'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  participants: string[];

  @ApiProperty({
    description: 'Ação a ser executada',
    enum: ['approve', 'reject'],
  })
  @IsString()
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';
}
