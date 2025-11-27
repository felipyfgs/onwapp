import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ContactService } from './contact.service';
import {
  ContactJidDto,
  CheckNumberDto,
  SuccessResponseDto,
  CheckNumberResponseDto,
  ProfilePictureResponseDto,
  ContactStatusResponseDto,
  BusinessProfileResponseDto,
} from './dto';

@ApiTags('Contacts')
@ApiSecurity('apikey')
@Controller('sessions/:session/contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('block')
  @ApiOperation({ summary: 'Block a contact' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Contact blocked',
    type: SuccessResponseDto,
  })
  async block(
    @Param('session') session: string,
    @Body() dto: ContactJidDto,
  ): Promise<SuccessResponseDto> {
    await this.contactService.block(session, dto.jid);
    return { success: true };
  }

  @Post('unblock')
  @ApiOperation({ summary: 'Unblock a contact' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Contact unblocked',
    type: SuccessResponseDto,
  })
  async unblock(
    @Param('session') session: string,
    @Body() dto: ContactJidDto,
  ): Promise<SuccessResponseDto> {
    await this.contactService.unblock(session, dto.jid);
    return { success: true };
  }

  @Post('check')
  @ApiOperation({ summary: 'Check if a phone number exists on WhatsApp' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Number check result',
    type: CheckNumberResponseDto,
  })
  async checkNumber(
    @Param('session') session: string,
    @Body() dto: CheckNumberDto,
  ): Promise<CheckNumberResponseDto> {
    return this.contactService.checkNumber(session, dto.phone);
  }

  @Get(':jid/picture')
  @ApiOperation({ summary: 'Get contact profile picture URL' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiParam({ name: 'jid', description: 'Contact JID' })
  @ApiResponse({
    status: 200,
    description: 'Profile picture URL',
    type: ProfilePictureResponseDto,
  })
  async getProfilePicture(
    @Param('session') session: string,
    @Param('jid') jid: string,
  ): Promise<ProfilePictureResponseDto> {
    return this.contactService.getProfilePicture(session, jid);
  }

  @Get(':jid/status')
  @ApiOperation({ summary: 'Get contact status message' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiParam({ name: 'jid', description: 'Contact JID' })
  @ApiResponse({
    status: 200,
    description: 'Contact status',
    type: ContactStatusResponseDto,
  })
  async getStatus(
    @Param('session') session: string,
    @Param('jid') jid: string,
  ): Promise<ContactStatusResponseDto> {
    return this.contactService.getStatus(session, jid);
  }

  @Get(':jid/business')
  @ApiOperation({ summary: 'Get business profile information' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiParam({ name: 'jid', description: 'Contact JID' })
  @ApiResponse({
    status: 200,
    description: 'Business profile',
    type: BusinessProfileResponseDto,
  })
  async getBusinessProfile(
    @Param('session') session: string,
    @Param('jid') jid: string,
  ): Promise<BusinessProfileResponseDto> {
    return this.contactService.getBusinessProfile(session, jid);
  }

  @Get('broadcast/:broadcastId')
  @ApiOperation({ summary: 'Get broadcast list information' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiParam({
    name: 'broadcastId',
    description: 'Broadcast list ID (e.g., 1234@broadcast)',
  })
  @ApiResponse({
    status: 200,
    description: 'Broadcast list info',
  })
  async getBroadcastListInfo(
    @Param('session') session: string,
    @Param('broadcastId') broadcastId: string,
  ) {
    return this.contactService.getBroadcastListInfo(session, broadcastId);
  }
}
