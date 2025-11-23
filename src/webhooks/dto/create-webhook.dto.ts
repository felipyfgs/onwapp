import { IsString, IsUrl, IsArray, IsBoolean, IsOptional, ArrayMinSize } from 'class-validator';
import { IsValidEvent } from '../validators/is-valid-event.validator';

export class CreateWebhookDto {
  @IsString()
  sessionId: string;

  @IsUrl()
  url: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsValidEvent({ each: true })
  events: string[];

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
