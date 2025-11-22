import { IsString, Matches } from 'class-validator';

export class PairPhoneDto {
  @IsString()
  @Matches(/^\d{10,15}$/, { message: 'Phone must be 10-15 digits' })
  phoneNumber: string;
}
