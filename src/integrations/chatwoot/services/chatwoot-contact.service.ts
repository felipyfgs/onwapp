import { Injectable, Logger } from '@nestjs/common';
import { ChatwootConfigService } from './chatwoot-config.service';
import {
  ChatwootContact,
  FilterPayloadItem,
  CreateContactParams,
} from '../interfaces';
import { getBrazilPhoneVariations } from '../../../common/utils';

/**
 * Service responsible for Chatwoot contact operations
 *
 * Handles contact search, creation, and updates in Chatwoot.
 */
@Injectable()
export class ChatwootContactService {
  private readonly logger = new Logger(ChatwootContactService.name);

  constructor(private readonly configService: ChatwootConfigService) {}

  /**
   * Find a contact by phone number or group JID
   */
  async findContact(
    sessionId: string,
    phoneNumber: string,
  ): Promise<ChatwootContact | null> {
    const config = await this.configService.getConfig(sessionId);
    if (!config) return null;

    const client = this.configService.getClientForConfig(config);
    if (!client) return null;

    try {
      const isGroup = phoneNumber.includes('@g.us');
      const query = isGroup
        ? phoneNumber
        : `+${phoneNumber.replace('@s.whatsapp.net', '').split(':')[0]}`;

      if (isGroup) {
        const result = await client.searchContacts(query);
        return result.payload.find((c) => c.identifier === phoneNumber) || null;
      }

      // Use filter for phone numbers (more precise)
      const filterPayload = this.buildPhoneFilterPayload(query);
      const result = await client.filterContacts(filterPayload);

      if (result.payload.length === 0) return null;
      if (result.payload.length === 1) return result.payload[0];

      // Multiple contacts found - find the best match
      return this.findBestMatchingContact(
        result.payload,
        query,
        config.mergeBrazil,
      );
    } catch (error) {
      this.logger.error(
        `Error finding contact for session ${sessionId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Create a new contact in Chatwoot
   */
  async createContact(
    sessionId: string,
    params: CreateContactParams,
  ): Promise<ChatwootContact | null> {
    const client = await this.configService.getClient(sessionId);
    if (!client) return null;

    try {
      const contactData: {
        inbox_id: number;
        name: string;
        identifier: string;
        phone_number?: string;
        avatar_url?: string;
      } = {
        inbox_id: params.inboxId,
        name: params.name || params.phoneNumber,
        identifier: params.identifier || params.phoneNumber,
      };

      if (!params.isGroup) {
        contactData.phone_number = `+${params.phoneNumber}`;
      }

      if (params.avatarUrl) {
        contactData.avatar_url = params.avatarUrl;
      }

      const result = await client.createContact(contactData);
      this.logger.debug(
        `Created contact for session ${sessionId}: ${result.payload?.contact?.id}`,
      );
      return result.payload?.contact || null;
    } catch (error) {
      this.logger.error(
        `Error creating contact for session ${sessionId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Update an existing contact
   */
  async updateContact(
    sessionId: string,
    contactId: number,
    data: Partial<{
      name: string;
      avatar_url: string;
      identifier: string;
    }>,
  ): Promise<ChatwootContact | null> {
    const client = await this.configService.getClient(sessionId);
    if (!client) return null;

    try {
      const updated = await client.updateContact(contactId, data);
      this.logger.debug(
        `Updated contact ${contactId} for session ${sessionId}`,
      );
      return updated;
    } catch (error) {
      this.logger.error(
        `Error updating contact ${contactId} for session ${sessionId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Find or create a contact
   */
  async findOrCreateContact(
    sessionId: string,
    params: CreateContactParams,
  ): Promise<ChatwootContact | null> {
    // First try to find existing contact
    const existingContact = await this.findContact(sessionId, params.identifier || params.phoneNumber);
    if (existingContact) {
      return existingContact;
    }

    // Create new contact
    return this.createContact(sessionId, params);
  }

  /**
   * Build filter payload for phone number search
   */
  private buildPhoneFilterPayload(query: string): FilterPayloadItem[] {
    const numbers = getBrazilPhoneVariations(query);
    return numbers.map((number, index) => ({
      attribute_key: 'phone_number',
      filter_operator: 'equal_to',
      values: [number.replace('+', '')],
      query_operator: index === numbers.length - 1 ? null : 'OR',
    }));
  }

  /**
   * Find the best matching contact from multiple results
   */
  private findBestMatchingContact(
    contacts: ChatwootContact[],
    query: string,
    mergeBrazilContacts: boolean,
  ): ChatwootContact | null {
    const phoneVariations = getBrazilPhoneVariations(query);

    // If merge is enabled and we have exactly 2 contacts for Brazil numbers,
    // prefer the one with 14 digits (includes 9)
    if (
      contacts.length === 2 &&
      mergeBrazilContacts &&
      query.startsWith('+55')
    ) {
      const contact = contacts.find((c) => c.phone_number?.length === 14);
      if (contact) return contact;
    }

    // Try to match exact phone number
    for (const contact of contacts) {
      if (phoneVariations.includes(contact.phone_number || '')) {
        return contact;
      }
    }

    // Return first match as fallback
    return contacts[0];
  }
}
