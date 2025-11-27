import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SuccessResponseDto {
  @ApiProperty({ example: true, description: 'Operation success status' })
  success: boolean;
}

export class ProfilePictureResponseDto {
  @ApiPropertyOptional({
    example: 'https://...',
    description: 'Profile picture URL',
  })
  url: string | null | undefined;
}
