import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RejectCallDto {
  @ApiProperty({
    example: 'ABCD1234',
    description: 'Call ID received from the call webhook event',
  })
  @IsString()
  @IsNotEmpty()
  callId: string;

  @ApiProperty({
    example: '5511999999999@s.whatsapp.net',
    description: 'JID of the caller',
  })
  @IsString()
  @IsNotEmpty()
  callFrom: string;
}

export { SuccessResponseDto } from '../../../common/dto';
