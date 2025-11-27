import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import {
  CreateGroupDto,
  UpdateGroupSubjectDto,
  UpdateGroupDescriptionDto,
  UpdateGroupPictureDto,
  GroupParticipantsDto,
  GroupSettingsDto,
  JoinGroupDto,
  AcceptInviteV4Dto,
  CreateGroupResponseDto,
  GroupMetadataResponseDto,
  InviteCodeResponseDto,
  GroupInfoByCodeResponseDto,
  SuccessResponseDto,
  JoinGroupResponseDto,
  ParticipantsUpdateResponseDto,
} from './dto';

@ApiTags('Groups')
@ApiSecurity('apikey')
@Controller('sessions/:name/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 201,
    description: 'Group created',
    type: CreateGroupResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async createGroup(
    @Param('name') name: string,
    @Body() dto: CreateGroupDto,
  ): Promise<CreateGroupResponseDto> {
    return this.groupsService.createGroup(name, dto);
  }

  @Get(':groupId')
  @ApiOperation({ summary: 'Get group metadata' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiParam({ name: 'groupId', description: 'Group ID (e.g., 123456789@g.us)' })
  @ApiResponse({
    status: 200,
    description: 'Group metadata',
    type: GroupMetadataResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session or group not found' })
  async getGroupMetadata(
    @Param('name') name: string,
    @Param('groupId') groupId: string,
  ): Promise<GroupMetadataResponseDto> {
    return this.groupsService.getGroupMetadata(name, groupId);
  }

  @Put(':groupId/subject')
  @ApiOperation({ summary: 'Update group subject/name' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Subject updated',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async updateSubject(
    @Param('name') name: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupSubjectDto,
  ): Promise<SuccessResponseDto> {
    await this.groupsService.updateGroupSubject(name, groupId, dto.subject);
    return { success: true };
  }

  @Put(':groupId/description')
  @ApiOperation({ summary: 'Update group description' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Description updated',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async updateDescription(
    @Param('name') name: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDescriptionDto,
  ): Promise<SuccessResponseDto> {
    await this.groupsService.updateGroupDescription(
      name,
      groupId,
      dto.description,
    );
    return { success: true };
  }

  @Post(':groupId/participants')
  @ApiOperation({
    summary: 'Update group participants (add, remove, promote, demote)',
  })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Participants updated',
    type: ParticipantsUpdateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async updateParticipants(
    @Param('name') name: string,
    @Param('groupId') groupId: string,
    @Body() dto: GroupParticipantsDto,
  ): Promise<ParticipantsUpdateResponseDto> {
    const response = await this.groupsService.updateParticipants(
      name,
      groupId,
      dto.participants,
      dto.action,
    );
    return { success: true, response };
  }

  @Put(':groupId/settings')
  @ApiOperation({ summary: 'Update group settings' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Settings updated',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async updateSettings(
    @Param('name') name: string,
    @Param('groupId') groupId: string,
    @Body() dto: GroupSettingsDto,
  ): Promise<SuccessResponseDto> {
    await this.groupsService.updateGroupSettings(name, groupId, dto.setting);
    return { success: true };
  }

  @Get(':groupId/invite-code')
  @ApiOperation({ summary: 'Get group invite code' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Invite code',
    type: InviteCodeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getInviteCode(
    @Param('name') name: string,
    @Param('groupId') groupId: string,
  ): Promise<InviteCodeResponseDto> {
    return this.groupsService.getInviteCode(name, groupId);
  }

  @Post(':groupId/revoke-invite')
  @ApiOperation({ summary: 'Revoke group invite code' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'New invite code',
    type: InviteCodeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async revokeInviteCode(
    @Param('name') name: string,
    @Param('groupId') groupId: string,
  ): Promise<InviteCodeResponseDto> {
    return this.groupsService.revokeInviteCode(name, groupId);
  }

  @Get('invite/:inviteCode/info')
  @ApiOperation({ summary: 'Get group info by invite code' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiParam({ name: 'inviteCode', description: 'Group invite code' })
  @ApiResponse({
    status: 200,
    description: 'Group info',
    type: GroupInfoByCodeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getGroupInfoByCode(
    @Param('name') name: string,
    @Param('inviteCode') inviteCode: string,
  ): Promise<GroupInfoByCodeResponseDto> {
    return this.groupsService.getGroupInfoByCode(name, inviteCode);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a group using invite code' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Joined group',
    type: JoinGroupResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async joinGroup(
    @Param('name') name: string,
    @Body() dto: JoinGroupDto,
  ): Promise<JoinGroupResponseDto> {
    const groupId = await this.groupsService.joinGroup(name, dto.inviteCode);
    return { groupId };
  }

  @Delete(':groupId/leave')
  @ApiOperation({ summary: 'Leave a group' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Left group',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async leaveGroup(
    @Param('name') name: string,
    @Param('groupId') groupId: string,
  ): Promise<SuccessResponseDto> {
    await this.groupsService.leaveGroup(name, groupId);
    return { success: true };
  }

  @Put(':groupId/picture')
  @ApiOperation({ summary: 'Update group picture' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Picture updated',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async updateGroupPicture(
    @Param('name') name: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupPictureDto,
  ): Promise<SuccessResponseDto> {
    await this.groupsService.updateGroupPicture(name, groupId, dto.imageUrl);
    return { success: true };
  }

  @Post('join-v4')
  @ApiOperation({ summary: 'Join a group using invite message (V4)' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Joined group',
    type: JoinGroupResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async acceptInviteV4(
    @Param('name') name: string,
    @Body() dto: AcceptInviteV4Dto,
  ): Promise<JoinGroupResponseDto> {
    const groupId = await this.groupsService.acceptInviteV4(
      name,
      dto.senderId,
      dto.inviteMessage,
    );
    return { groupId };
  }
}
