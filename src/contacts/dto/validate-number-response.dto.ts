import { ApiProperty } from '@nestjs/swagger';

export class ValidateNumberResponseDto {
  @ApiProperty({
    description: 'Resultados da validação',
    example: [
      { jid: '5511999999999@s.whatsapp.net', exists: true },
      { jid: '5521888888888@s.whatsapp.net', exists: false },
    ],
  })
  results: Array<{
    jid: string;
    exists: boolean;
    lid?: string;
  }>;
}
