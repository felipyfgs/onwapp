import { registerDecorator, ValidationOptions } from 'class-validator';

export const VALID_WEBHOOK_EVENTS = [
  // Connection
  'connection.update',
  'creds.update',

  // History
  'messaging-history.set',

  // Chats
  'chats.upsert',
  'chats.update',
  'chats.delete',

  // Presence
  'presence.update',

  // Contacts
  'contacts.upsert',
  'contacts.update',
  'contacts.phone-number-share',

  // Messages
  'messages.pdo-response',
  'messages.delete',
  'messages.update',
  'messages.media-update',
  'messages.upsert',
  'messages.reaction',
  'message-receipt.update',

  // Groups
  'groups.upsert',
  'groups.update',
  'group-participants.update',
  'group.join-request',

  // Blocklist
  'blocklist.set',
  'blocklist.update',

  // Calls
  'call',

  // Labels (WhatsApp Business)
  'labels.edit',
  'labels.association',

  // LID Mapping
  'lid-mapping.update',

  // Newsletter (Channels)
  'newsletter.reaction',
  'newsletter.view',
  'newsletter-participants.update',
  'newsletter-settings.update',
];

export function IsValidEvent(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidEvent',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') {
            return false;
          }
          return VALID_WEBHOOK_EVENTS.includes(value);
        },
        defaultMessage() {
          return `Each event must be one of the following: ${VALID_WEBHOOK_EVENTS.join(', ')}`;
        },
      },
    });
  };
}
