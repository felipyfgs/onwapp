import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AcceptCommunityInviteDto {
  @ApiProperty({ description: 'Código do convite' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
