import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateCommunitySubjectDto {
  @ApiProperty({ description: 'Novo nome da comunidade' })
  @IsString()
  @IsNotEmpty()
  subject: string;
}

export class UpdateCommunityDescriptionDto {
  @ApiProperty({ description: 'Nova descrição da comunidade' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
