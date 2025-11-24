import { registerDecorator, ValidationOptions } from 'class-validator';

export const VALID_WEBHOOK_EVENTS = [
  'connection.update',
  'creds.update',
  'messaging-history.set',
  'chats.upsert',
  'chats.update',
  'chats.phoneNumberShare',
  'chats.delete',
  'presence.update',
  'contacts.upsert',
  'contacts.update',
  'contacts.phone-number-share',
  'messages.pdo-response',
  'messages.delete',
  'messages.update',
  'messages.media-update',
  'messages.upsert',
  'messages.reaction',
  'message-receipt.update',
  'groups.upsert',
  'groups.update',
  'group-participants.update',
  'blocklist.set',
  'blocklist.update',
  'call',
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
