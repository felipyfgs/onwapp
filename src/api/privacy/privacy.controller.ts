import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PrivacyService } from './privacy.service';
import {
  UpdateLastSeenPrivacyDto,
  UpdateOnlinePrivacyDto,
  UpdateProfilePicturePrivacyDto,
  UpdateStatusPrivacyDto,
  UpdateReadReceiptsPrivacyDto,
  UpdateGroupsAddPrivacyDto,
  UpdateCallPrivacyDto,
  UpdateMessagesPrivacyDto,
  PrivacySettingsResponseDto,
  SuccessResponseDto,
} from './dto';

@ApiTags('Privacy')
@ApiSecurity('apikey')
@Controller('sessions/:session/privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all privacy settings' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Privacy settings',
    type: PrivacySettingsResponseDto,
  })
  async getPrivacySettings(
    @Param('session') session: string,
  ): Promise<PrivacySettingsResponseDto> {
    return this.privacyService.getPrivacySettings(session);
  }

  @Post('last-seen')
  @ApiOperation({ summary: 'Update last seen privacy' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Privacy updated',
    type: SuccessResponseDto,
  })
  async updateLastSeenPrivacy(
    @Param('session') session: string,
    @Body() dto: UpdateLastSeenPrivacyDto,
  ): Promise<SuccessResponseDto> {
    await this.privacyService.updateLastSeenPrivacy(session, dto.value);
    return { success: true };
  }

  @Post('online')
  @ApiOperation({ summary: 'Update online privacy' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Privacy updated',
    type: SuccessResponseDto,
  })
  async updateOnlinePrivacy(
    @Param('session') session: string,
    @Body() dto: UpdateOnlinePrivacyDto,
  ): Promise<SuccessResponseDto> {
    await this.privacyService.updateOnlinePrivacy(session, dto.value);
    return { success: true };
  }

  @Post('profile-picture')
  @ApiOperation({ summary: 'Update profile picture privacy' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Privacy updated',
    type: SuccessResponseDto,
  })
  async updateProfilePicturePrivacy(
    @Param('session') session: string,
    @Body() dto: UpdateProfilePicturePrivacyDto,
  ): Promise<SuccessResponseDto> {
    await this.privacyService.updateProfilePicturePrivacy(session, dto.value);
    return { success: true };
  }

  @Post('status')
  @ApiOperation({ summary: 'Update status privacy' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Privacy updated',
    type: SuccessResponseDto,
  })
  async updateStatusPrivacy(
    @Param('session') session: string,
    @Body() dto: UpdateStatusPrivacyDto,
  ): Promise<SuccessResponseDto> {
    await this.privacyService.updateStatusPrivacy(session, dto.value);
    return { success: true };
  }

  @Post('read-receipts')
  @ApiOperation({ summary: 'Update read receipts privacy' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Privacy updated',
    type: SuccessResponseDto,
  })
  async updateReadReceiptsPrivacy(
    @Param('session') session: string,
    @Body() dto: UpdateReadReceiptsPrivacyDto,
  ): Promise<SuccessResponseDto> {
    await this.privacyService.updateReadReceiptsPrivacy(session, dto.value);
    return { success: true };
  }

  @Post('groups-add')
  @ApiOperation({ summary: 'Update who can add you to groups' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Privacy updated',
    type: SuccessResponseDto,
  })
  async updateGroupsAddPrivacy(
    @Param('session') session: string,
    @Body() dto: UpdateGroupsAddPrivacyDto,
  ): Promise<SuccessResponseDto> {
    await this.privacyService.updateGroupsAddPrivacy(session, dto.value);
    return { success: true };
  }

  @Post('calls')
  @ApiOperation({ summary: 'Update call privacy' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Privacy updated',
    type: SuccessResponseDto,
  })
  async updateCallPrivacy(
    @Param('session') session: string,
    @Body() dto: UpdateCallPrivacyDto,
  ): Promise<SuccessResponseDto> {
    await this.privacyService.updateCallPrivacy(session, dto.value);
    return { success: true };
  }

  @Post('messages')
  @ApiOperation({ summary: 'Update messages privacy' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Privacy updated',
    type: SuccessResponseDto,
  })
  async updateMessagesPrivacy(
    @Param('session') session: string,
    @Body() dto: UpdateMessagesPrivacyDto,
  ): Promise<SuccessResponseDto> {
    await this.privacyService.updateMessagesPrivacy(session, dto.value);
    return { success: true };
  }
}
