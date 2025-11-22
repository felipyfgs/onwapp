import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateSessionDto {
    @IsString()
    name: string;

    @IsUrl()
    @IsOptional()
    webhookUrl?: string;
}
