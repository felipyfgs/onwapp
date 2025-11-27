import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class PairingCodeRequestDto {
  @ApiProperty({
    example: '5511999999999',
    description: 'Phone number without + or spaces',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'Phone number must contain only digits' })
  phoneNumber: string;

  @ApiPropertyOptional({
    example: 'ABC123',
    description: 'Custom pairing code (optional, 6-8 characters)',
  })
  @IsString()
  @IsOptional()
  customCode?: string;
}

export class PairingCodeResponseDto {
  @ApiProperty({
    example: 'ABC12345',
    description: 'Pairing code to enter on phone',
  })
  code: string;
}
