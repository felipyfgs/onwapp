import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SessionService } from './session.service';

@ApiTags('Sessions')
@ApiSecurity('apikey')
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  async findAll() {
    return this.sessionService.findAll();
  }

  @Post(':id/create')
  async create(@Param('id') id: string) {
    return this.sessionService.create(id);
  }

  @Post(':id/connect')
  async connect(@Param('id') id: string) {
    return this.sessionService.connect(id);
  }

  @Get(':id/qr')
  async getQr(@Param('id') id: string) {
    const qr = await this.sessionService.getQr(id);
    if (!qr) {
      throw new HttpException('QR not available', HttpStatus.NOT_FOUND);
    }
    return { qr };
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    return this.sessionService.getStatus(id);
  }

  @Post(':id/logout')
  async logout(@Param('id') id: string) {
    return this.sessionService.logout(id);
  }

  @Post(':id/restart')
  async restart(@Param('id') id: string) {
    return this.sessionService.restart(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.sessionService.remove(id);
  }

  @Get(':id/info')
  async getInfo(@Param('id') id: string) {
    return this.sessionService.getInfo(id);
  }
}
