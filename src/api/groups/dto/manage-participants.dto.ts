import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsString } from 'class-validator';

export class ManageParticipantsDto {
  @ApiProperty({
    description: 'Lista de JIDs dos participantes',
    example: ['5511999999999@s.whatsapp.net', '5511988888888@s.whatsapp.net'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participants: string[];
}
