import { IsString, IsOptional, IsArray, IsUrl } from 'class-validator';

export class CreateSessionDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsUrl()
    webhookUrl?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    webhookEvents?: string[];
}
