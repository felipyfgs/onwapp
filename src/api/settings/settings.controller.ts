import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto, SettingsResponseDto } from './dto';

@ApiTags('Settings')
@Controller('sessions/:session/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({ status: 200, type: SettingsResponseDto })
  async getSettings(
    @Param('session') session: string,
  ): Promise<SettingsResponseDto> {
    return this.settingsService.getSettings(session);
  }

  @Post()
  @ApiOperation({ summary: 'Update settings (partial update supported)' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({ status: 200, type: SettingsResponseDto })
  async updateSettings(
    @Param('session') session: string,
    @Body() dto: UpdateSettingsDto,
  ): Promise<SettingsResponseDto> {
    return this.settingsService.updateSettings(session, dto);
  }
}
