import { IsString, IsOptional, IsArray, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
    @ApiProperty({ description: 'Unique name for the session', example: 'my-session' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'Webhook URL for receiving events', example: 'https://example.com/webhook' })
    @IsOptional()
    @IsUrl()
    webhookUrl?: string;

    @ApiPropertyOptional({ description: 'List of events to subscribe to', example: ['messages.upsert'], type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    webhookEvents?: string[];
}
