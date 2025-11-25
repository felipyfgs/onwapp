import { Injectable, OnModuleInit } from '@nestjs/common';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { ValidateNumberDto } from './dto/validate-number.dto';
import { ValidateNumberResponseDto } from './dto/validate-number-response.dto';
import { BusinessProfileResponseDto } from './dto/business-profile-response.dto';
import { validateSocket } from '../../common/utils/socket-validator';

interface ContactsData {
  contacts: any[];
  lastUpdate: Date;
}

@Injectable()
export class ContactsService implements OnModuleInit {
  private contactsCache: Map<string, ContactsData> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor(private readonly whatsappService: WhatsAppService) {}

  onModuleInit() {
    this.startCacheCleanup();
  }

  private startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, data] of this.contactsCache.entries()) {
        if (now - data.lastUpdate.getTime() > this.CACHE_TTL) {
          this.contactsCache.delete(sessionId);
        }
      }
    }, 60000);
  }

  async validateNumbers(
    sessionId: string,
    dto: ValidateNumberDto,
  ): Promise<ValidateNumberResponseDto> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    const results = await socket.onWhatsApp(...dto.numbers);

    return {
      results: results.map((result) => ({
        jid: result.jid,
        exists: result.exists,
        lid: result.lid,
      })),
    };
  }

  async getBusinessProfile(
    sessionId: string,
    jid: string,
  ): Promise<BusinessProfileResponseDto | null> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    const profile = await socket.getBusinessProfile(jid);

    if (!profile) {
      return null;
    }

    return {
      jid,
      description: profile.description,
      category: profile.category,
      email: profile.email,
      website: Array.isArray(profile.website)
        ? profile.website[0]
        : (profile.website as any),
    };
  }

  registerContactsListener(sessionId: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      return;
    }

    socket.ev.on('contacts.upsert', (contacts: any[]) => {
      const cachedData = this.contactsCache.get(sessionId);
      const currentContacts = cachedData?.contacts || [];
      const updatedContacts = [...currentContacts];

      contacts.forEach((contact) => {
        const index = updatedContacts.findIndex((c) => c.id === contact.id);
        if (index >= 0) {
          updatedContacts[index] = contact;
        } else {
          updatedContacts.push(contact);
        }
      });

      this.contactsCache.set(sessionId, {
        contacts: updatedContacts,
        lastUpdate: new Date(),
      });
    });
  }

  listContacts(sessionId: string): any[] {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    this.registerContactsListener(sessionId);

    const cachedData = this.contactsCache.get(sessionId);
    return cachedData?.contacts || [];
  }
}
