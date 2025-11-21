import { IsString, Matches } from 'class-validator';

export class PairPhoneDto {
    @IsString()
    @Matches(/^\+?[1-9]\d{1,14}$/, {
        message: 'Phone number must be in international format (e.g., +5511999999999)',
    })
    phoneNumber: string;
}
