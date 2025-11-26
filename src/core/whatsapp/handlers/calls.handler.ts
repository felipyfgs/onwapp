import { Injectable, Logger } from '@nestjs/common';
import { WASocket } from 'whaileys';
import { DatabaseService } from '../../../database/database.service';
import { CallStatus } from '@prisma/client';

interface CallEvent {
  id: string;
  from: string;
  timestamp: number;
  isVideo: boolean;
  isGroup: boolean;
  status: 'offer' | 'ringing' | 'timeout' | 'reject' | 'accept';
  offline?: boolean;
}

@Injectable()
export class CallsHandler {
  private readonly logger = new Logger(CallsHandler.name);

  constructor(private readonly prisma: DatabaseService) {}

  async handleCall(
    sessionId: string,
    socket: WASocket,
    calls: CallEvent[],
    rejectCallsEnabled: boolean,
  ): Promise<void> {
    this.logger.log(`[${sessionId}] Processando evento call`, {
      event: 'whatsapp.call',
      count: calls.length,
    });

    try {
      for (const call of calls) {
        let status: CallStatus;

        switch (call.status) {
          case 'offer':
          case 'ringing':
            status = CallStatus.ringing;
            break;
          case 'accept':
            status = CallStatus.accepted;
            break;
          case 'reject':
            status = CallStatus.rejected;
            break;
          case 'timeout':
            status = CallStatus.timeout;
            break;
          default:
            status = CallStatus.missed;
        }

        await this.prisma.call.upsert({
          where: {
            sessionId_callId: {
              sessionId,
              callId: call.id,
            },
          },
          create: {
            sessionId,
            callId: call.id,
            fromJid: call.from,
            status,
            isVideo: call.isVideo,
            isGroup: call.isGroup,
            timestamp: BigInt(call.timestamp),
          },
          update: {
            status,
          },
        });

        if (
          rejectCallsEnabled &&
          (call.status === 'offer' || call.status === 'ringing')
        ) {
          this.logger.log(
            `[${sessionId}] Rejeitando chamada automaticamente: ${call.id}`,
          );

          try {
            await socket.rejectCall(call.id, call.from);

            await this.prisma.call.update({
              where: {
                sessionId_callId: {
                  sessionId,
                  callId: call.id,
                },
              },
              data: {
                status: CallStatus.rejected,
              },
            });
          } catch (rejectError) {
            this.logger.error(
              `[${sessionId}] Erro ao rejeitar chamada: ${rejectError instanceof Error ? rejectError.message : 'Erro'}`,
            );
          }
        }
      }

      this.logger.log(`[${sessionId}] ${calls.length} chamadas processadas`);
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao processar call: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }
}
