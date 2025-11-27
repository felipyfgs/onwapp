import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ContactJidDto {
  @ApiProperty({
    example: '5511999999999@s.whatsapp.net',
    description: 'Contact JID',
  })
  @IsString()
  @IsNotEmpty()
  jid: string;
}

export class CheckNumberDto {
  @ApiProperty({
    example: '5511999999999',
    description: 'Phone number to check',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

export class CheckNumberResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether the number exists on WhatsApp',
  })
  exists: boolean;

  @ApiPropertyOptional({
    example: '5511999999999@s.whatsapp.net',
    description: 'JID if exists',
  })
  jid?: string;
}

export class ProfilePictureResponseDto {
  @ApiPropertyOptional({
    example: 'https://...',
    description: 'Profile picture URL',
  })
  url: string | null | undefined;
}

export class ContactStatusResponseDto {
  @ApiPropertyOptional({
    example: 'Hello World!',
    description: 'Contact status message',
  })
  status?: string;

  @ApiPropertyOptional({
    example: 1704067200,
    description: 'Status set timestamp',
  })
  setAt?: Date | number;
}

export class BusinessProfileResponseDto {
  @ApiPropertyOptional({
    example: 'Company Name',
    description: 'Business name',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'Business description',
    description: 'Business description',
  })
  description?: string;

  @ApiPropertyOptional({ example: 'Retail', description: 'Business category' })
  category?: string;

  @ApiPropertyOptional({
    example: 'https://example.com',
    description: 'Website URL',
  })
  website?: string;

  @ApiPropertyOptional({ example: 'contact@example.com', description: 'Email' })
  email?: string;

  @ApiPropertyOptional({ example: '123 Street, City', description: 'Address' })
  address?: string;
}

export class BlocklistResponseDto {
  @ApiProperty({
    example: ['5511999999999@s.whatsapp.net'],
    description: 'List of blocked JIDs',
  })
  blocklist: string[];
}

export class AddContactDto {
  @ApiProperty({
    example: '5511999999999@s.whatsapp.net',
    description: 'Contact JID',
  })
  @IsString()
  @IsNotEmpty()
  jid: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Full name of the contact',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'First name of the contact',
  })
  @IsString()
  @IsOptional()
  firstName?: string;
}
