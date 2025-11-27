import { Controller, Post, Param, Body } from '@nestjs/common';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import {
  UpdateStatusDto,
  UpdateNameDto,
  UpdatePictureDto,
  UpdatePresenceDto,
  SubscribePresenceDto,
  SuccessResponseDto,
} from './dto';

@ApiTags('Profile')
@ApiSecurity('apikey')
@Controller('sessions/:session/profile')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('status')
  @ApiOperation({ summary: 'Update profile status message' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Status updated',
    type: SuccessResponseDto,
  })
  async updateStatus(
    @Param('session') session: string,
    @Body() dto: UpdateStatusDto,
  ): Promise<SuccessResponseDto> {
    await this.profilesService.updateStatus(session, dto.status);
    return { success: true };
  }

  @Post('name')
  @ApiOperation({ summary: 'Update profile display name' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Name updated',
    type: SuccessResponseDto,
  })
  async updateName(
    @Param('session') session: string,
    @Body() dto: UpdateNameDto,
  ): Promise<SuccessResponseDto> {
    await this.profilesService.updateName(session, dto.name);
    return { success: true };
  }

  @Post('picture')
  @ApiOperation({ summary: 'Update profile picture' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Picture updated',
    type: SuccessResponseDto,
  })
  async updatePicture(
    @Param('session') session: string,
    @Body() dto: UpdatePictureDto,
  ): Promise<SuccessResponseDto> {
    await this.profilesService.updatePicture(session, dto.imageUrl);
    return { success: true };
  }

  @Post('presence')
  @ApiOperation({ summary: 'Update presence status (online, typing, etc.)' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Presence updated',
    type: SuccessResponseDto,
  })
  async updatePresence(
    @Param('session') session: string,
    @Body() dto: UpdatePresenceDto,
  ): Promise<SuccessResponseDto> {
    await this.profilesService.updatePresence(session, dto.presence, dto.jid);
    return { success: true };
  }

  @Post('presence/subscribe')
  @ApiOperation({ summary: 'Subscribe to presence updates from a contact' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Subscribed to presence',
    type: SuccessResponseDto,
  })
  async subscribePresence(
    @Param('session') session: string,
    @Body() dto: SubscribePresenceDto,
  ): Promise<SuccessResponseDto> {
    await this.profilesService.subscribePresence(session, dto.jid);
    return { success: true };
  }
}
