import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateNewsletterDescriptionDto {
  @ApiProperty({ description: 'Nova descrição do canal', maxLength: 2048 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  description: string;
}
