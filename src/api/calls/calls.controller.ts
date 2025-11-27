import { Controller, Post, Param, Body } from '@nestjs/common';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { RejectCallDto, SuccessResponseDto } from './dto';

/**
 * Controller for WhatsApp call operations.
 * Handles call rejection and call-related events.
 */
@ApiTags('Calls')
@ApiSecurity('apikey')
@Controller('sessions/:session/calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post('reject')
  @ApiOperation({
    summary: 'Reject an incoming call',
    description:
      'Reject a call using the callId and callFrom received from the call webhook event',
  })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Call rejected',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Failed to reject call' })
  async rejectCall(
    @Param('session') session: string,
    @Body() dto: RejectCallDto,
  ): Promise<SuccessResponseDto> {
    await this.callsService.rejectCall(session, dto);
    return { success: true };
  }
}
