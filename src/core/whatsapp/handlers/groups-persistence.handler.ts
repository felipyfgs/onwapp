import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

interface GroupMetadata {
  id: string;
  subject?: string;
  owner?: string;
  desc?: string;
  descId?: string;
  restrict?: boolean;
  announce?: boolean;
  size?: number;
  participants?: Array<{
    id: string;
    admin?: 'admin' | 'superadmin' | null;
  }>;
  ephemeralDuration?: number;
  inviteCode?: string;
  creation?: number;
}

interface ParticipantUpdate {
  id: string;
  participants: string[];
  action: 'add' | 'remove' | 'promote' | 'demote';
}

@Injectable()
export class GroupsPersistenceHandler {
  private readonly logger = new Logger(GroupsPersistenceHandler.name);

  constructor(private readonly prisma: DatabaseService) {}

  async handleGroupsUpsert(
    sessionId: string,
    groups: GroupMetadata[],
  ): Promise<void> {
    this.logger.log(`[${sessionId}] Processando groups.upsert`, {
      event: 'whatsapp.groups.upsert',
      count: groups.length,
    });

    try {
      for (const group of groups) {
        if (!group.id) continue;

        await this.prisma.group.upsert({
          where: {
            sessionId_groupJid: {
              sessionId,
              groupJid: group.id,
            },
          },
          create: {
            sessionId,
            groupJid: group.id,
            subject: group.subject,
            owner: group.owner,
            description: group.desc,
            participants: group.participants
              ? JSON.parse(JSON.stringify(group.participants))
              : undefined,
            creation: group.creation ? BigInt(group.creation) : undefined,
            restrict: group.restrict ?? false,
            announce: group.announce ?? false,
            size: group.size,
            ephemeral: group.ephemeralDuration,
            inviteCode: group.inviteCode,
          },
          update: {
            subject: group.subject,
            owner: group.owner,
            description: group.desc,
            participants: group.participants
              ? JSON.parse(JSON.stringify(group.participants))
              : undefined,
            restrict: group.restrict,
            announce: group.announce,
            size: group.size,
            ephemeral: group.ephemeralDuration,
            inviteCode: group.inviteCode,
          },
        });
      }

      this.logger.log(`[${sessionId}] ${groups.length} grupos persistidos`);
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao processar groups.upsert: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async handleGroupsUpdate(
    sessionId: string,
    updates: Partial<GroupMetadata>[],
  ): Promise<void> {
    this.logger.log(`[${sessionId}] Processando groups.update`, {
      event: 'whatsapp.groups.update',
      count: updates.length,
    });

    try {
      for (const update of updates) {
        if (!update.id) continue;

        const updateData: Record<string, unknown> = {};

        if (update.subject !== undefined) updateData.subject = update.subject;
        if (update.desc !== undefined) updateData.description = update.desc;
        if (update.restrict !== undefined)
          updateData.restrict = update.restrict;
        if (update.announce !== undefined)
          updateData.announce = update.announce;
        if (update.ephemeralDuration !== undefined)
          updateData.ephemeral = update.ephemeralDuration;

        if (Object.keys(updateData).length > 0) {
          await this.prisma.group.updateMany({
            where: {
              sessionId,
              groupJid: update.id,
            },
            data: updateData,
          });
        }
      }

      this.logger.log(`[${sessionId}] ${updates.length} grupos atualizados`);
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao processar groups.update: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async handleGroupParticipantsUpdate(
    sessionId: string,
    update: ParticipantUpdate,
  ): Promise<void> {
    this.logger.log(`[${sessionId}] Processando group-participants.update`, {
      event: 'whatsapp.group-participants.update',
      groupId: update.id,
      action: update.action,
      count: update.participants.length,
    });

    try {
      const group = await this.prisma.group.findUnique({
        where: {
          sessionId_groupJid: {
            sessionId,
            groupJid: update.id,
          },
        },
      });

      if (!group) {
        this.logger.warn(
          `[${sessionId}] Grupo ${update.id} não encontrado no banco`,
        );
        return;
      }

      let participants =
        (group.participants as Array<{
          id: string;
          admin?: string | null;
        }>) || [];

      switch (update.action) {
        case 'add':
          for (const p of update.participants) {
            if (!participants.find((x) => x.id === p)) {
              participants.push({ id: p, admin: null });
            }
          }
          break;

        case 'remove':
          participants = participants.filter(
            (p) => !update.participants.includes(p.id),
          );
          break;

        case 'promote':
          for (const p of update.participants) {
            const participant = participants.find((x) => x.id === p);
            if (participant) {
              participant.admin = 'admin';
            }
          }
          break;

        case 'demote':
          for (const p of update.participants) {
            const participant = participants.find((x) => x.id === p);
            if (participant) {
              participant.admin = null;
            }
          }
          break;
      }

      await this.prisma.group.update({
        where: {
          sessionId_groupJid: {
            sessionId,
            groupJid: update.id,
          },
        },
        data: {
          participants: JSON.parse(JSON.stringify(participants)),
          size: participants.length,
        },
      });

      this.logger.log(
        `[${sessionId}] Participantes do grupo ${update.id} atualizados`,
      );
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao processar group-participants.update: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }
}
