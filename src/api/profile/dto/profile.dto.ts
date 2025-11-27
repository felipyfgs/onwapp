import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    example: 'Hello World!',
    description: 'New profile status message',
  })
  @IsString()
  @IsNotEmpty()
  status: string;
}

export class UpdateNameDto {
  @ApiProperty({ example: 'John Doe', description: 'New profile display name' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdatePictureDto {
  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'URL to the new profile picture',
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}

export class UpdatePresenceDto {
  @ApiProperty({
    example: 'available',
    description: 'Presence status',
    enum: ['available', 'unavailable', 'composing', 'recording', 'paused'],
  })
  @IsString()
  @IsIn(['available', 'unavailable', 'composing', 'recording', 'paused'])
  presence: 'available' | 'unavailable' | 'composing' | 'recording' | 'paused';

  @ApiProperty({
    example: '5511999999999@s.whatsapp.net',
    description: 'Target JID (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  jid?: string;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

export class SubscribePresenceDto {
  @ApiProperty({
    example: '5511999999999@s.whatsapp.net',
    description: 'JID to subscribe to presence updates',
  })
  @IsString()
  @IsNotEmpty()
  jid: string;
}
