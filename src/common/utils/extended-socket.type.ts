import { WASocket } from 'whaileys';

/**
 * Extended socket type with methods that may not be available in all whaileys versions.
 * These methods are from newer versions of Baileys/Whaileys.
 * Use runtime checks before calling these methods.
 */
export type ExtendedWASocket = WASocket & {
  // Star messages
  star?: (jid: string, messages: string[], star: boolean) => Promise<void>;

  // Group requests
  groupRequestParticipantsList?: (jid: string) => Promise<any[]>;
  groupRequestParticipantsUpdate?: (
    jid: string,
    participants: string[],
    action: 'approve' | 'reject',
  ) => Promise<any>;
  groupMemberAddMode?: (
    jid: string,
    mode: 'all_member_add' | 'admin_add',
  ) => Promise<void>;
  groupJoinApprovalMode?: (jid: string, mode: 'on' | 'off') => Promise<void>;

  // Calls
  createCallLink?: () => Promise<string>;

  // Labels
  addLabel?: (name: string, color: number) => Promise<any>;
  addChatLabel?: (chatId: string, labelId: string) => Promise<void>;
  removeChatLabel?: (chatId: string, labelId: string) => Promise<void>;
  addMessageLabel?: (
    chatId: string,
    messageId: string,
    labelId: string,
  ) => Promise<void>;
  removeMessageLabel?: (
    chatId: string,
    messageId: string,
    labelId: string,
  ) => Promise<void>;

  // Newsletter
  newsletterCreate?: (name: string, description?: string) => Promise<any>;
  newsletterMetadata?: (type: string, jid: string) => Promise<any>;
  newsletterFollow?: (jid: string) => Promise<void>;
  newsletterUnfollow?: (jid: string) => Promise<void>;
  newsletterMute?: (jid: string) => Promise<void>;
  newsletterUnmute?: (jid: string) => Promise<void>;
  newsletterUpdateName?: (jid: string, name: string) => Promise<void>;
  newsletterUpdateDescription?: (
    jid: string,
    description: string,
  ) => Promise<void>;
  newsletterUpdatePicture?: (
    jid: string,
    content: { url: string },
  ) => Promise<void>;
  newsletterRemovePicture?: (jid: string) => Promise<void>;
  newsletterReactMessage?: (
    jid: string,
    serverId: string,
    reaction?: string,
  ) => Promise<void>;
  newsletterFetchMessages?: (
    jid: string,
    count: number,
    cursor?: unknown,
  ) => Promise<any[]>;
  newsletterDelete?: (jid: string) => Promise<void>;
  newsletterAdminCount?: (jid: string) => Promise<number>;
  newsletterSubscribers?: (jid: string) => Promise<any[]>;

  // Communities
  communityCreate?: (
    subject: string,
    description?: string,
    linkedGroups?: string[],
  ) => Promise<any>;
  communityMetadata?: (jid: string) => Promise<any>;
  communityLeave?: (jid: string) => Promise<void>;
  communityCreateGroup?: (
    jid: string,
    subject: string,
    participants?: string[],
  ) => Promise<any>;
  communityLinkGroup?: (jid: string, groupIds: string[]) => Promise<void>;
  communityUnlinkGroup?: (jid: string, groupIds: string[]) => Promise<void>;
  communityFetchLinkedGroups?: (jid: string) => Promise<any[]>;
  communityUpdateSubject?: (jid: string, subject: string) => Promise<void>;
  communityUpdateDescription?: (
    jid: string,
    description: string,
  ) => Promise<void>;
  communityInviteCode?: (jid: string) => Promise<string>;
  communityAcceptInvite?: (code: string) => Promise<string>;
  communityRevokeInvite?: (jid: string) => Promise<string>;
  communityParticipantsUpdate?: (
    jid: string,
    participants: string[],
    action: 'add' | 'remove' | 'promote' | 'demote',
  ) => Promise<any>;

  // Contacts
  fetchDisappearingDuration?: (jid: string) => Promise<number | null>;
};

/**
 * Helper to check if a method exists on the socket
 */
export function hasMethod<T extends keyof ExtendedWASocket>(
  socket: ExtendedWASocket | undefined,
  method: T,
): socket is ExtendedWASocket & Required<Pick<ExtendedWASocket, T>> {
  return !!socket && typeof socket[method] === 'function';
}
