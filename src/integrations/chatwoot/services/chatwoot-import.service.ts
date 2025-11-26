import { Injectable, Logger } from '@nestjs/common';
import { Chatwoot, Contact, Message } from '@prisma/client';
import { ChatwootPostgresClient } from '../libs/chatwoot-postgres.client';
import { ChatwootConfigService } from './chatwoot-config.service';
import { ChatwootMessageService } from './chatwoot-message.service';
import { PersistenceService } from '../../../core/persistence/persistence.service';
import { ChatwootInbox } from '../interfaces';

interface ChatwootUser {
  user_type: string;
  user_id: number;
}

interface FksChatwoot {
  phone_number: string;
  contact_id: string;
  conversation_id: string;
}

interface FirstLastTimestamp {
  first: number;
  last: number;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

/**
 * Service for Chatwoot PostgreSQL direct operations
 *
 * Handles advanced features requiring direct database access:
 * - Labels/Tags on contacts
 * - Import history (contacts and messages)
 * - Sync lost messages
 */
@Injectable()
export class ChatwootImportService {
  private readonly logger = new Logger(ChatwootImportService.name);

  private historyMessages = new Map<string, Message[]>();
  private historyContacts = new Map<string, Contact[]>();
  private repositoryMessagesCache = new Map<string, Set<string>>();

  constructor(
    private readonly pgClient: ChatwootPostgresClient,
    private readonly configService: ChatwootConfigService,
    private readonly messageService: ChatwootMessageService,
    private readonly persistenceService: PersistenceService,
  ) {}

  /**
   * Check if PostgreSQL import is available for a session
   */
  async isImportAvailable(sessionId: string): Promise<boolean> {
    const config = await this.configService.getConfig(sessionId);
    if (!config?.postgresUrl) {
      return false;
    }
    return await this.pgClient.testConnection(config.postgresUrl);
  }

  /**
   * Add label/tag to a contact in Chatwoot
   */
  async addLabelToContact(
    sessionId: string,
    contactId: number,
  ): Promise<boolean> {
    try {
      const config = await this.configService.getConfig(sessionId);
      if (!config?.postgresUrl || !config.inbox) {
        return false;
      }

      const nameInbox = config.inbox;

      // Get or create tag
      const sqlTags = `SELECT id, taggings_count FROM tags WHERE name = $1 LIMIT 1`;
      const tagData = await this.pgClient.query<{
        id: number;
        taggings_count: number;
      }>(config.postgresUrl, sqlTags, [nameInbox]);
      let tagId = tagData?.rows[0]?.id;
      const taggingsCount = tagData?.rows[0]?.taggings_count || 0;

      // Insert or update tag
      const sqlTag = `INSERT INTO tags (name, taggings_count)
        VALUES ($1, $2)
        ON CONFLICT (name)
        DO UPDATE SET taggings_count = tags.taggings_count + 1
        RETURNING id`;
      const tagResult = await this.pgClient.query<{ id: number }>(
        config.postgresUrl,
        sqlTag,
        [nameInbox, taggingsCount + 1],
      );
      tagId = tagResult?.rows[0]?.id;

      if (!tagId) {
        this.logger.warn(`[${sessionId}] Failed to get/create tag`);
        return false;
      }

      // Check if tagging already exists
      const sqlCheckTagging = `SELECT 1 FROM taggings
        WHERE tag_id = $1 AND taggable_type = 'Contact' AND taggable_id = $2 AND context = 'labels' LIMIT 1`;
      const taggingExists = await this.pgClient.query(
        config.postgresUrl,
        sqlCheckTagging,
        [tagId, contactId],
      );

      if (taggingExists && (taggingExists.rowCount ?? 0) > 0) {
        return true; // Already tagged
      }

      // Insert tagging
      const sqlInsertLabel = `INSERT INTO taggings (tag_id, taggable_type, taggable_id, context, created_at)
        VALUES ($1, 'Contact', $2, 'labels', NOW())`;
      await this.pgClient.query(config.postgresUrl, sqlInsertLabel, [
        tagId,
        contactId,
      ]);

      this.logger.debug(
        `[${sessionId}] Added label "${nameInbox}" to contact ${contactId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Error adding label to contact: ${(error as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Add messages to history buffer for import
   */
  addHistoryMessages(sessionId: string, messages: Message[]): void {
    const existing = this.historyMessages.get(sessionId) || [];
    this.historyMessages.set(sessionId, [...existing, ...messages]);
  }

  /**
   * Add contacts to history buffer for import
   */
  addHistoryContacts(sessionId: string, contacts: Contact[]): void {
    const existing = this.historyContacts.get(sessionId) || [];
    this.historyContacts.set(sessionId, [...existing, ...contacts]);
  }

  /**
   * Get count of buffered history messages
   */
  getHistoryMessagesCount(sessionId: string): number {
    return this.historyMessages.get(sessionId)?.length ?? 0;
  }

  /**
   * Clear all history buffers for a session
   */
  clearHistory(sessionId: string): void {
    this.historyMessages.delete(sessionId);
    this.historyContacts.delete(sessionId);
    this.repositoryMessagesCache.delete(sessionId);
  }

  /**
   * Get Chatwoot user info from token
   */
  private async getChatwootUser(
    config: Chatwoot,
  ): Promise<ChatwootUser | null> {
    if (!config.postgresUrl || !config.token) {
      return null;
    }

    try {
      const sqlUser = `SELECT owner_type AS user_type, owner_id AS user_id
        FROM access_tokens
        WHERE token = $1`;
      const result = await this.pgClient.query<ChatwootUser>(
        config.postgresUrl,
        sqlUser,
        [config.token],
      );
      return result?.rows[0] || null;
    } catch (error) {
      this.logger.error(
        `Error getting Chatwoot user: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Get existing source IDs from Chatwoot to avoid duplicates
   */
  async getExistingSourceIds(
    config: Chatwoot,
    sourceIds: string[],
    conversationId?: number,
  ): Promise<Set<string>> {
    const existingIds = new Set<string>();

    if (!config.postgresUrl || sourceIds.length === 0) {
      return existingIds;
    }

    try {
      const formattedIds = sourceIds.map(
        (id) => `WAID:${id.replace('WAID:', '')}`,
      );

      const params = conversationId
        ? [formattedIds, conversationId]
        : [formattedIds];

      const query = conversationId
        ? 'SELECT source_id FROM messages WHERE source_id = ANY($1) AND conversation_id = $2'
        : 'SELECT source_id FROM messages WHERE source_id = ANY($1)';

      const result = await this.pgClient.query<{ source_id: string }>(
        config.postgresUrl,
        query,
        params,
      );

      for (const row of result?.rows || []) {
        existingIds.add(row.source_id);
      }
    } catch (error) {
      this.logger.error(
        `Error getting existing source IDs: ${(error as Error).message}`,
      );
    }

    return existingIds;
  }

  /**
   * Import contacts from history buffer to Chatwoot
   */
  async importHistoryContacts(sessionId: string): Promise<ImportResult> {
    const result: ImportResult = { success: false, imported: 0, errors: [] };

    try {
      // Wait for messages to be processed first
      if (this.getHistoryMessagesCount(sessionId) > 0) {
        return result;
      }

      const config = await this.configService.getConfig(sessionId);
      if (!config?.postgresUrl || !config.accountId || !config.inbox) {
        result.errors.push('PostgreSQL not configured');
        return result;
      }

      const contacts = this.historyContacts.get(sessionId) || [];
      if (contacts.length === 0) {
        result.success = true;
        return result;
      }

      this.logger.log(
        `[${sessionId}] Importing ${contacts.length} contacts to Chatwoot`,
      );

      // Get or create label
      const labelSql = `SELECT id FROM labels WHERE title = $1 AND account_id = $2 LIMIT 1`;
      let labelResult = await this.pgClient.query<{ id: number }>(
        config.postgresUrl,
        labelSql,
        [config.inbox, config.accountId],
      );
      let labelId = labelResult?.rows[0]?.id;

      if (!labelId) {
        const sqlLabel = `INSERT INTO labels (title, color, show_on_sidebar, account_id, created_at, updated_at)
          VALUES ($1, '#34039B', true, $2, NOW(), NOW()) RETURNING id`;
        labelResult = await this.pgClient.query<{ id: number }>(
          config.postgresUrl,
          sqlLabel,
          [config.inbox, config.accountId],
        );
        labelId = labelResult?.rows[0]?.id;
      }

      // Process contacts in batches
      const batchSize = 1000;
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);

        // Build insert query
        let sqlInsert = `INSERT INTO contacts
          (name, phone_number, account_id, identifier, created_at, updated_at) VALUES `;
        const bindInsert: unknown[] = [config.accountId];

        for (const contact of batch) {
          const isGroup = this.isIgnorePhoneNumber(contact.remoteJid);
          const contactName = isGroup
            ? `${contact.name} (GROUP)`
            : contact.name || contact.remoteJid.split('@')[0];

          bindInsert.push(contactName);
          const bindName = `$${bindInsert.length}`;

          let bindPhoneNumber: string;
          if (!isGroup) {
            bindInsert.push(`+${contact.remoteJid.split('@')[0]}`);
            bindPhoneNumber = `$${bindInsert.length}`;
          } else {
            bindPhoneNumber = 'NULL';
          }

          bindInsert.push(contact.remoteJid);
          const bindIdentifier = `$${bindInsert.length}`;

          sqlInsert += `(${bindName}, ${bindPhoneNumber}, $1, ${bindIdentifier}, NOW(), NOW()),`;
        }

        sqlInsert = sqlInsert.slice(0, -1);
        sqlInsert += ` ON CONFLICT (identifier, account_id)
          DO UPDATE SET
            name = EXCLUDED.name,
            phone_number = EXCLUDED.phone_number,
            identifier = EXCLUDED.identifier`;

        const insertResult = await this.pgClient.query(
          config.postgresUrl,
          sqlInsert,
          bindInsert,
        );
        result.imported += insertResult?.rowCount ?? 0;

        // Add tags to contacts
        if (labelId) {
          await this.addTagsToContacts(config, batch, labelId);
        }
      }

      this.historyContacts.delete(sessionId);
      result.success = true;

      this.logger.log(
        `[${sessionId}] Imported ${result.imported} contacts to Chatwoot`,
      );
    } catch (error) {
      result.errors.push((error as Error).message);
      this.logger.error(
        `[${sessionId}] Error importing contacts: ${(error as Error).message}`,
      );
    }

    return result;
  }

  /**
   * Add tags to imported contacts
   */
  private async addTagsToContacts(
    config: Chatwoot,
    contacts: Contact[],
    _labelId: number,
  ): Promise<void> {
    if (!config.postgresUrl || !config.accountId || !config.inbox) {
      return;
    }

    try {
      // Get or create tag
      const sqlTag = `INSERT INTO tags (name, taggings_count)
        VALUES ($1, $2)
        ON CONFLICT (name)
        DO UPDATE SET taggings_count = tags.taggings_count + $2
        RETURNING id`;
      const tagResult = await this.pgClient.query<{ id: number }>(
        config.postgresUrl,
        sqlTag,
        [config.inbox, contacts.length],
      );
      const tagId = tagResult?.rows[0]?.id;

      if (!tagId) return;

      // Build taggings insert
      let sqlInsertLabel = `INSERT INTO taggings (tag_id, taggable_type, taggable_id, context, created_at) VALUES `;

      for (const contact of contacts) {
        const bindTaggableId = `(SELECT id FROM contacts WHERE identifier = '${contact.remoteJid}' AND account_id = ${config.accountId})`;
        sqlInsertLabel += `(${tagId}, 'Contact', ${bindTaggableId}, 'labels', NOW()),`;
      }

      sqlInsertLabel = sqlInsertLabel.slice(0, -1);
      sqlInsertLabel += ` ON CONFLICT DO NOTHING`;

      await this.pgClient.query(config.postgresUrl, sqlInsertLabel);
    } catch (error) {
      this.logger.error(
        `Error adding tags to contacts: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Import messages from history buffer to Chatwoot
   */
  async importHistoryMessages(
    sessionId: string,
    inbox: ChatwootInbox,
  ): Promise<ImportResult> {
    const result: ImportResult = { success: false, imported: 0, errors: [] };

    try {
      const config = await this.configService.getConfig(sessionId);
      if (!config?.postgresUrl || !config.accountId) {
        result.errors.push('PostgreSQL not configured');
        return result;
      }

      const chatwootUser = await this.getChatwootUser(config);
      if (!chatwootUser) {
        result.errors.push('Could not get Chatwoot user');
        return result;
      }

      let messages = this.historyMessages.get(sessionId) || [];
      if (messages.length === 0) {
        result.success = true;
        return result;
      }

      this.logger.log(
        `[${sessionId}] Importing ${messages.length} messages to Chatwoot`,
      );

      // Sort messages by phone number and timestamp
      messages.sort((a, b) => {
        const aTimestamp = Number(a.timestamp);
        const bTimestamp = Number(b.timestamp);
        return (
          a.remoteJid.localeCompare(b.remoteJid) || aTimestamp - bTimestamp
        );
      });

      // Get existing source IDs to avoid duplicates
      const sourceIds = messages.map((m) => m.messageId);
      const existingIds = await this.getExistingSourceIds(config, sourceIds);
      messages = messages.filter(
        (m) => !existingIds.has(`WAID:${m.messageId}`),
      );

      if (messages.length === 0) {
        this.historyMessages.delete(sessionId);
        result.success = true;
        return result;
      }

      // Group messages by phone number
      const messagesByPhone = this.createMessagesMapByPhoneNumber(messages);

      // Get timestamps for each phone number
      const phoneTimestamps = new Map<string, FirstLastTimestamp>();
      messagesByPhone.forEach((msgs, phone) => {
        phoneTimestamps.set(phone, {
          first: Number(msgs[0]?.timestamp),
          last: Number(msgs[msgs.length - 1]?.timestamp),
        });
      });

      // Create or get contacts and conversations
      const fksByNumber = await this.selectOrCreateFksFromChatwoot(
        config,
        inbox,
        phoneTimestamps,
        messagesByPhone,
      );

      // Insert messages in batches
      const batchSize = 2000;
      const allMessages = Array.from(messagesByPhone.entries()).flatMap(
        ([phone, msgs]) => msgs.map((msg) => ({ phone, message: msg })),
      );

      for (let i = 0; i < allMessages.length; i += batchSize) {
        const batch = allMessages.slice(i, i + batchSize);

        let sqlInsertMsg = `INSERT INTO messages
          (content, processed_message_content, account_id, inbox_id, conversation_id, message_type, private, content_type,
          sender_type, sender_id, source_id, created_at, updated_at) VALUES `;
        const bindInsertMsg: unknown[] = [config.accountId, inbox.id];

        for (const { phone, message } of batch) {
          const fks = fksByNumber.get(phone);
          if (!fks?.conversation_id || !fks?.contact_id) {
            continue;
          }

          const content = this.getContentMessage(message);
          if (!content) {
            continue;
          }

          bindInsertMsg.push(content);
          const bindContent = `$${bindInsertMsg.length}`;

          bindInsertMsg.push(fks.conversation_id);
          const bindConversationId = `$${bindInsertMsg.length}`;

          bindInsertMsg.push(message.fromMe ? '1' : '0');
          const bindMessageType = `$${bindInsertMsg.length}`;

          bindInsertMsg.push(
            message.fromMe ? chatwootUser.user_type : 'Contact',
          );
          const bindSenderType = `$${bindInsertMsg.length}`;

          bindInsertMsg.push(
            message.fromMe ? chatwootUser.user_id : fks.contact_id,
          );
          const bindSenderId = `$${bindInsertMsg.length}`;

          bindInsertMsg.push(`WAID:${message.messageId}`);
          const bindSourceId = `$${bindInsertMsg.length}`;

          bindInsertMsg.push(Number(message.timestamp));
          const bindTimestamp = `$${bindInsertMsg.length}`;

          sqlInsertMsg += `(${bindContent}, ${bindContent}, $1, $2, ${bindConversationId}, ${bindMessageType}, FALSE, 0,
            ${bindSenderType}, ${bindSenderId}, ${bindSourceId}, to_timestamp(${bindTimestamp}), to_timestamp(${bindTimestamp})),`;
        }

        if (bindInsertMsg.length > 2) {
          sqlInsertMsg = sqlInsertMsg.slice(0, -1);
          const insertResult = await this.pgClient.query(
            config.postgresUrl,
            sqlInsertMsg,
            bindInsertMsg,
          );
          result.imported += insertResult?.rowCount ?? 0;
        }
      }

      this.historyMessages.delete(sessionId);
      this.repositoryMessagesCache.delete(sessionId);

      // Import contacts after messages
      await this.importHistoryContacts(sessionId);

      result.success = true;
      this.logger.log(
        `[${sessionId}] Imported ${result.imported} messages to Chatwoot`,
      );
    } catch (error) {
      result.errors.push((error as Error).message);
      this.logger.error(
        `[${sessionId}] Error importing messages: ${(error as Error).message}`,
      );
      this.historyMessages.delete(sessionId);
      this.repositoryMessagesCache.delete(sessionId);
    }

    return result;
  }

  /**
   * Select or create contacts, contact_inboxes, and conversations in Chatwoot
   */
  private async selectOrCreateFksFromChatwoot(
    config: Chatwoot,
    inbox: ChatwootInbox,
    phoneTimestamps: Map<string, FirstLastTimestamp>,
    messagesByPhone: Map<string, Message[]>,
  ): Promise<Map<string, FksChatwoot>> {
    if (!config.postgresUrl || !config.accountId) {
      return new Map();
    }

    const bindValues: unknown[] = [config.accountId, inbox.id];
    const phoneNumberBind = Array.from(messagesByPhone.keys())
      .map((phone) => {
        const ts = phoneTimestamps.get(phone);
        if (ts) {
          bindValues.push(phone);
          let bindStr = `($${bindValues.length},`;
          bindValues.push(ts.first);
          bindStr += `$${bindValues.length},`;
          bindValues.push(ts.last);
          return `${bindStr}$${bindValues.length})`;
        }
        return null;
      })
      .filter(Boolean)
      .join(',');

    if (!phoneNumberBind) {
      return new Map();
    }

    const sqlFromChatwoot = `WITH
      phone_number AS (
        SELECT phone_number, created_at::INTEGER, last_activity_at::INTEGER FROM (
          VALUES ${phoneNumberBind}
        ) as t (phone_number, created_at, last_activity_at)
      ),
      only_new_phone_number AS (
        SELECT * FROM phone_number
        WHERE phone_number NOT IN (
          SELECT phone_number
          FROM contacts
          JOIN contact_inboxes ci ON ci.contact_id = contacts.id AND ci.inbox_id = $2
          JOIN conversations con ON con.contact_inbox_id = ci.id
            AND con.account_id = $1
            AND con.inbox_id = $2
            AND con.contact_id = contacts.id
          WHERE contacts.account_id = $1
        )
      ),
      new_contact AS (
        INSERT INTO contacts (name, phone_number, account_id, identifier, created_at, updated_at)
        SELECT REPLACE(p.phone_number, '+', ''), p.phone_number, $1, CONCAT(REPLACE(p.phone_number, '+', ''),
          '@s.whatsapp.net'), to_timestamp(p.created_at), to_timestamp(p.last_activity_at)
        FROM only_new_phone_number AS p
        ON CONFLICT(identifier, account_id) DO UPDATE SET updated_at = EXCLUDED.updated_at
        RETURNING id, phone_number, created_at, updated_at
      ),
      new_contact_inbox AS (
        INSERT INTO contact_inboxes (contact_id, inbox_id, source_id, created_at, updated_at)
        SELECT new_contact.id, $2, gen_random_uuid(), new_contact.created_at, new_contact.updated_at
        FROM new_contact
        RETURNING id, contact_id, created_at, updated_at
      ),
      new_conversation AS (
        INSERT INTO conversations (account_id, inbox_id, status, contact_id,
          contact_inbox_id, uuid, last_activity_at, created_at, updated_at)
        SELECT $1, $2, 0, new_contact_inbox.contact_id, new_contact_inbox.id, gen_random_uuid(),
          new_contact_inbox.updated_at, new_contact_inbox.created_at, new_contact_inbox.updated_at
        FROM new_contact_inbox
        RETURNING id, contact_id
      )
      SELECT new_contact.phone_number, new_conversation.contact_id, new_conversation.id AS conversation_id
      FROM new_conversation
      JOIN new_contact ON new_conversation.contact_id = new_contact.id
      UNION
      SELECT p.phone_number, c.id contact_id, con.id conversation_id
      FROM phone_number p
      JOIN contacts c ON c.phone_number = p.phone_number
      JOIN contact_inboxes ci ON ci.contact_id = c.id AND ci.inbox_id = $2
      JOIN conversations con ON con.contact_inbox_id = ci.id AND con.account_id = $1
        AND con.inbox_id = $2 AND con.contact_id = c.id`;

    try {
      const result = await this.pgClient.query<FksChatwoot>(
        config.postgresUrl,
        sqlFromChatwoot,
        bindValues,
      );
      return new Map(
        result?.rows.map((item) => [item.phone_number, item]) || [],
      );
    } catch (error) {
      this.logger.error(
        `Error selecting/creating FKs: ${(error as Error).message}`,
      );
      return new Map();
    }
  }

  /**
   * Sync lost messages from the last N hours
   * @param sessionId - Session ID
   * @param hours - Number of hours to look back (default: 6, max: 72)
   */
  async syncLostMessages(sessionId: string, hours = 6): Promise<ImportResult> {
    const result: ImportResult = { success: false, imported: 0, errors: [] };

    // Validate hours (min 1, max 72)
    const syncHours = Math.min(Math.max(hours, 1), 72);

    try {
      const config = await this.configService.getConfig(sessionId);
      if (!config?.postgresUrl || !config.accountId) {
        result.errors.push('PostgreSQL not configured');
        return result;
      }

      const inbox = await this.configService.getInbox(sessionId);
      if (!inbox) {
        result.errors.push('Inbox not found');
        return result;
      }

      // Get messages from Chatwoot in the last N hours
      const sqlMessages = `SELECT source_id FROM messages m
        WHERE account_id = $1
        AND inbox_id = $2
        AND created_at >= now() - interval '${syncHours} hours'
        AND source_id IS NOT NULL
        ORDER BY created_at DESC`;

      const chatwootMessages = await this.pgClient.query<{ source_id: string }>(
        config.postgresUrl,
        sqlMessages,
        [config.accountId, inbox.id],
      );

      const chatwootIds = new Set(
        chatwootMessages?.rows
          .filter((m) => m.source_id?.startsWith('WAID:'))
          .map((m) => m.source_id.replace('WAID:', '')) || [],
      );

      // Get messages from our database in the last N hours
      const syncTimeAgo = Math.floor(Date.now() / 1000) - syncHours * 60 * 60;
      const localMessages =
        await this.persistenceService.getMessagesAfterTimestamp(
          sessionId,
          syncTimeAgo,
        );

      // Filter messages not in Chatwoot
      const missingMessages = localMessages.filter(
        (m) =>
          !chatwootIds.has(m.messageId) &&
          !this.isIgnorePhoneNumber(m.remoteJid),
      );

      if (missingMessages.length === 0) {
        result.success = true;
        return result;
      }

      this.logger.log(
        `[${sessionId}] Syncing ${missingMessages.length} lost messages`,
      );

      // Add to history and import
      this.addHistoryMessages(sessionId, missingMessages);
      const importResult = await this.importHistoryMessages(sessionId, inbox);

      result.success = importResult.success;
      result.imported = importResult.imported;
      result.errors = importResult.errors;
    } catch (error) {
      result.errors.push((error as Error).message);
      this.logger.error(
        `[${sessionId}] Error syncing lost messages: ${(error as Error).message}`,
      );
    }

    return result;
  }

  /**
   * Get recent contacts ordered by conversation activity
   */
  async getContactsOrderByRecentConversations(
    sessionId: string,
    limit = 50,
  ): Promise<Array<{ id: number; phone_number: string; identifier: string }>> {
    try {
      const config = await this.configService.getConfig(sessionId);
      if (!config?.postgresUrl || !config.accountId) {
        return [];
      }

      const inbox = await this.configService.getInbox(sessionId);
      if (!inbox) {
        return [];
      }

      const sql = `SELECT contacts.id, contacts.identifier, contacts.phone_number
        FROM conversations
        JOIN contacts ON contacts.id = conversations.contact_id
        WHERE conversations.account_id = $1
        AND inbox_id = $2
        ORDER BY conversations.last_activity_at DESC
        LIMIT $3`;

      const result = await this.pgClient.query<{
        id: number;
        phone_number: string;
        identifier: string;
      }>(config.postgresUrl, sql, [config.accountId, inbox.id, limit]);

      return result?.rows || [];
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Error getting recent contacts: ${(error as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Create a map of messages grouped by phone number
   */
  private createMessagesMapByPhoneNumber(
    messages: Message[],
  ): Map<string, Message[]> {
    return messages.reduce((acc, message) => {
      if (!this.isIgnorePhoneNumber(message.remoteJid)) {
        const phoneNumber = message.remoteJid.split('@')[0];
        if (phoneNumber) {
          const phoneWithPlus = `+${phoneNumber}`;
          const existing = acc.get(phoneWithPlus) || [];
          existing.push(message);
          acc.set(phoneWithPlus, existing);
        }
      }
      return acc;
    }, new Map<string, Message[]>());
  }

  /**
   * Get message content for import
   */
  private getContentMessage(message: Message): string | null {
    if (message.textContent) {
      return message.textContent;
    }

    // Fallback to message content
    const content = message.content as Record<string, unknown>;
    if (!content) {
      return null;
    }

    // Try to extract text from various message types
    if (content.conversation) {
      return content.conversation as string;
    }
    if (content.extendedTextMessage) {
      const ext = content.extendedTextMessage as { text?: string };
      return ext.text || null;
    }

    // For media messages, return placeholder
    const mediaTypes: Record<string, string> = {
      imageMessage: '_<Image Message>_',
      videoMessage: '_<Video Message>_',
      audioMessage: '_<Audio Message>_',
      documentMessage: '_<Document>_',
      stickerMessage: '_<Sticker>_',
    };

    for (const [type, placeholder] of Object.entries(mediaTypes)) {
      if (content[type]) {
        const media = content[type] as { caption?: string; fileName?: string };
        if (media.caption) {
          return media.caption;
        }
        if (media.fileName) {
          return `_<File: ${media.fileName}>_`;
        }
        return placeholder;
      }
    }

    return null;
  }

  /**
   * Check if phone number should be ignored (groups, status, etc.)
   */
  private isIgnorePhoneNumber(remoteJid: string): boolean {
    return (
      remoteJid.includes('@g.us') ||
      remoteJid === 'status@broadcast' ||
      remoteJid === '0@s.whatsapp.net'
    );
  }

  /**
   * Update message source ID in Chatwoot
   */
  async updateMessageSourceId(
    sessionId: string,
    messageId: number,
    sourceId: string,
  ): Promise<boolean> {
    try {
      const config = await this.configService.getConfig(sessionId);
      if (!config?.postgresUrl) {
        return false;
      }

      const sql = `UPDATE messages SET source_id = $1, status = 0, created_at = NOW(), updated_at = NOW() WHERE id = $2`;
      await this.pgClient.query(config.postgresUrl, sql, [
        `WAID:${sourceId}`,
        messageId,
      ]);
      return true;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Error updating message source ID: ${(error as Error).message}`,
      );
      return false;
    }
  }
}
