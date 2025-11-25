import {
  IsBoolean,
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProxyDto {
  @ApiPropertyOptional({ description: 'Habilitar proxy', default: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Host do proxy',
    example: '192.168.1.100',
  })
  @IsString()
  @IsOptional()
  host?: string;

  @ApiPropertyOptional({ description: 'Porta do proxy', example: 8080 })
  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  port?: number;

  @ApiPropertyOptional({
    description: 'Protocolo do proxy',
    enum: ['http', 'https', 'socks4', 'socks5'],
    default: 'http',
  })
  @IsString()
  @IsIn(['http', 'https', 'socks4', 'socks5'])
  @IsOptional()
  protocol?: string;

  @ApiPropertyOptional({ description: 'Usuário do proxy' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ description: 'Senha do proxy' })
  @IsString()
  @IsOptional()
  password?: string;
}

export class ProxyResponseDto extends ProxyDto {
  @ApiProperty({ description: 'ID do proxy' })
  id: string;

  @ApiProperty({ description: 'ID da sessão' })
  sessionId: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
