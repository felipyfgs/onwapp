import { Injectable, BadRequestException } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { ValidateNumberDto } from './dto/validate-number.dto';
import { ValidateNumberResponseDto } from './dto/validate-number-response.dto';
import { BusinessProfileResponseDto } from './dto/business-profile-response.dto';

@Injectable()
export class ContactsService {
  private contactsCache: Map<string, any[]> = new Map();

  constructor(private readonly whatsappService: WhatsAppService) {}

  async validateNumbers(
    sessionId: string,
    dto: ValidateNumberDto,
  ): Promise<ValidateNumberResponseDto> {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

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
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

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
      if (!this.contactsCache.has(sessionId)) {
        this.contactsCache.set(sessionId, []);
      }

      const currentContacts = this.contactsCache.get(sessionId) || [];
      const updatedContacts = [...currentContacts];

      contacts.forEach((contact) => {
        const index = updatedContacts.findIndex((c) => c.id === contact.id);
        if (index >= 0) {
          updatedContacts[index] = contact;
        } else {
          updatedContacts.push(contact);
        }
      });

      this.contactsCache.set(sessionId, updatedContacts);
    });
  }

  listContacts(sessionId: string): any[] {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

    this.registerContactsListener(sessionId);

    return this.contactsCache.get(sessionId) || [];
  }

  clearContactsCache(sessionId: string) {
    this.contactsCache.delete(sessionId);
  }
}
