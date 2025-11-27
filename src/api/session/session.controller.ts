import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('Sessions')
@ApiSecurity('apikey')
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  async findAll() {
    return this.sessionService.findAll();
  }

  @Post('create')
  async create(@Body() dto: CreateSessionDto) {
    return this.sessionService.create(dto.name);
  }

  @Post(':name/connect')
  async connect(@Param('name') name: string) {
    return this.sessionService.connect(name);
  }

  @Get(':name/qr')
  async getQr(@Param('name') name: string) {
    const qr = await this.sessionService.getQr(name);
    if (!qr) {
      throw new HttpException('QR not available', HttpStatus.NOT_FOUND);
    }
    return { qr };
  }

  @Get(':name/status')
  async getStatus(@Param('name') name: string) {
    return this.sessionService.getStatus(name);
  }

  @Post(':name/logout')
  async logout(@Param('name') name: string) {
    return this.sessionService.logout(name);
  }

  @Post(':name/restart')
  async restart(@Param('name') name: string) {
    return this.sessionService.restart(name);
  }

  @Delete(':name')
  async remove(@Param('name') name: string) {
    return this.sessionService.remove(name);
  }

  @Get(':name/info')
  async getInfo(@Param('name') name: string) {
    return this.sessionService.getInfo(name);
  }
}
