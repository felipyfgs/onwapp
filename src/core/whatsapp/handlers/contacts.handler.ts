import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PersistenceService } from '../../persistence/persistence.service';

interface ContactData {
  id?: string;
  name?: string;
  notify?: string;
  verifiedName?: string;
  imgUrl?: string;
  status?: string;
}

@Injectable()
export class ContactsHandler {
  private readonly logger = new Logger(ContactsHandler.name);

  constructor(
    @Inject(forwardRef(() => PersistenceService))
    private readonly persistenceService: PersistenceService,
  ) {}

  async handleContactsUpsert(
    sessionId: string,
    contacts: ContactData[],
  ): Promise<void> {
    this.logger.log(`[${sessionId}] Processando contacts.upsert`, {
      event: 'whatsapp.contacts.upsert',
      count: contacts.length,
    });

    try {
      for (const contact of contacts) {
        if (!contact.id) continue;

        const name =
          contact.name || contact.notify || contact.verifiedName || undefined;

        await this.persistenceService.createOrUpdateContact(sessionId, {
          remoteJid: contact.id,
          name,
          avatarUrl: contact.imgUrl,
        });
      }

      this.logger.log(`[${sessionId}] ${contacts.length} contatos processados`);
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao processar contacts.upsert: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async handleContactsUpdate(
    sessionId: string,
    updates: ContactData[],
  ): Promise<void> {
    this.logger.log(`[${sessionId}] Processando contacts.update`, {
      event: 'whatsapp.contacts.update',
      count: updates.length,
    });

    try {
      for (const update of updates) {
        if (!update.id) continue;

        const updateData: {
          name?: string;
          avatarUrl?: string;
        } = {};

        if (update.name || update.notify || update.verifiedName) {
          updateData.name = update.name || update.notify || update.verifiedName;
        }

        if (update.imgUrl !== undefined) {
          updateData.avatarUrl = update.imgUrl;
        }

        if (Object.keys(updateData).length > 0) {
          await this.persistenceService.createOrUpdateContact(sessionId, {
            remoteJid: update.id,
            ...updateData,
          });
        }
      }

      this.logger.log(`[${sessionId}] ${updates.length} contatos atualizados`);
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao processar contacts.update: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }
}
