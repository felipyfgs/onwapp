import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PairPhoneDto {
    @ApiProperty({ description: 'Phone number in international format', example: '+5511999999999' })
    @IsString()
    @Matches(/^\+?[1-9]\d{1,14}$/, {
        message: 'Phone number must be in international format (e.g., +5511999999999)',
    })
    phoneNumber: string;
}
