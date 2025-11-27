import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateGroupPictureDto {
  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'URL to the new group picture',
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}
