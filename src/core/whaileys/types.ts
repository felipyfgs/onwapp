import { WASocket } from '@whiskeysockets/baileys';
import { SessionStatus } from '@prisma/client';

/**
 * Behavior settings for a WhatsApp session
 */
export interface BehaviorSettings {
  reject_call?: boolean;
  groups_ignore?: boolean;
  always_online?: boolean;
  read_messages?: boolean;
  read_status?: boolean;
  sync_full_history?: boolean;
}

/**
 * Instance of a WhatsApp session
 */
export interface SessionInstance {
  socket: WASocket;
  status: SessionStatus;
  qrcode?: string;
  dbSessionId?: string;
  behavior?: BehaviorSettings;
}

/**
 * Native flow button for interactive messages
 */
export interface NativeFlowButton {
  name: string;
  buttonParamsJson: string;
}

/**
 * Carousel card configuration
 */
export interface CarouselCard {
  imageUrl?: string;
  videoUrl?: string;
  title: string;
  body: string;
  footer?: string;
  buttons: NativeFlowButton[];
}

/**
 * Button message configuration
 */
export interface ButtonConfig {
  buttonId: string;
  buttonText: { displayText: string };
  type?: number;
}

/**
 * List section for list messages
 */
export interface ListSection {
  title: string;
  rows: Array<{
    title: string;
    rowId: string;
    description?: string;
  }>;
}

/**
 * Interactive message header with optional media
 */
export interface InteractiveHeader {
  title: string;
  subtitle: string;
  hasMediaAttachment: boolean;
  imageMessage?: Record<string, unknown>;
  videoMessage?: Record<string, unknown>;
}

/**
 * Carousel message structure
 */
export interface CarouselMessage {
  interactiveMessage: {
    body: { text: string };
    footer: { text: string };
    header: InteractiveHeader;
    carouselMessage: {
      cards: Array<Record<string, unknown>>;
      messageVersion: number;
    };
  };
}
