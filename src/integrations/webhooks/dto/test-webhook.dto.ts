import { IsOptional, IsString } from 'class-validator';
import { IsValidEvent } from '../validators/is-valid-event.validator';

export class TestWebhookDto {
  @IsString()
  @IsOptional()
  @IsValidEvent()
  event?: string;
}
