import { MessageKey } from './message-key.interface';

export interface LastMessage {
  key: MessageKey;
  messageTimestamp: number;
}
