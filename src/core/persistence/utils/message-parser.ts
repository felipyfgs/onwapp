import { proto } from 'whaileys';

export interface ParsedMessageContent {
  messageType: string;
  textContent: string | null;
  mediaUrl: string | null;
  fileLength: string | null;
  metadata: Record<string, any>;
}

export function parseMessageContent(
  message: proto.IWebMessageInfo,
): ParsedMessageContent {
  const msg = message.message;

  if (!msg) {
    return {
      messageType: 'empty',
      textContent: null,
      mediaUrl: null,
      fileLength: null,
      metadata: {},
    };
  }

  // Text messages: unify conversation and extendedTextMessage as 'conversation'
  // extendedTextMessage is essentially a text message with additional metadata (links, replies, etc.)
  if (msg.conversation) {
    return {
      messageType: 'conversation',
      textContent: msg.conversation,
      mediaUrl: null,
      fileLength: null,
      metadata: {},
    };
  }

  if (msg.extendedTextMessage) {
    return {
      messageType: 'conversation', // Unified as 'conversation' for consistency
      textContent: msg.extendedTextMessage.text || null,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        contextInfo: msg.extendedTextMessage.contextInfo,
        matchedText: msg.extendedTextMessage.matchedText,
        description: msg.extendedTextMessage.description,
        title: msg.extendedTextMessage.title,
      },
    };
  }

  if (msg.imageMessage) {
    return {
      messageType: 'imageMessage',
      textContent: msg.imageMessage.caption || null,
      mediaUrl: msg.imageMessage.url || null,
      fileLength: msg.imageMessage.fileLength?.toString() || null,
      metadata: {
        mimetype: msg.imageMessage.mimetype,
        height: msg.imageMessage.height,
        width: msg.imageMessage.width,
        fileSha256: msg.imageMessage.fileSha256,
        mediaKey: msg.imageMessage.mediaKey,
      },
    };
  }

  if (msg.videoMessage) {
    return {
      messageType: 'videoMessage',
      textContent: msg.videoMessage.caption || null,
      mediaUrl: msg.videoMessage.url || null,
      fileLength: msg.videoMessage.fileLength?.toString() || null,
      metadata: {
        mimetype: msg.videoMessage.mimetype,
        seconds: msg.videoMessage.seconds,
        height: msg.videoMessage.height,
        width: msg.videoMessage.width,
        fileSha256: msg.videoMessage.fileSha256,
        mediaKey: msg.videoMessage.mediaKey,
      },
    };
  }

  if (msg.audioMessage) {
    return {
      messageType: 'audioMessage',
      textContent: null,
      mediaUrl: msg.audioMessage.url || null,
      fileLength: msg.audioMessage.fileLength?.toString() || null,
      metadata: {
        mimetype: msg.audioMessage.mimetype,
        seconds: msg.audioMessage.seconds,
        ptt: msg.audioMessage.ptt,
        fileSha256: msg.audioMessage.fileSha256,
        mediaKey: msg.audioMessage.mediaKey,
      },
    };
  }

  if (msg.documentMessage) {
    return {
      messageType: 'documentMessage',
      textContent: msg.documentMessage.caption || null,
      mediaUrl: msg.documentMessage.url || null,
      fileLength: msg.documentMessage.fileLength?.toString() || null,
      metadata: {
        mimetype: msg.documentMessage.mimetype,
        fileName: msg.documentMessage.fileName,
        fileSha256: msg.documentMessage.fileSha256,
        mediaKey: msg.documentMessage.mediaKey,
      },
    };
  }

  if (msg.stickerMessage) {
    return {
      messageType: 'stickerMessage',
      textContent: null,
      mediaUrl: msg.stickerMessage.url || null,
      fileLength: msg.stickerMessage.fileLength?.toString() || null,
      metadata: {
        mimetype: msg.stickerMessage.mimetype,
        height: msg.stickerMessage.height,
        width: msg.stickerMessage.width,
        fileSha256: msg.stickerMessage.fileSha256,
        mediaKey: msg.stickerMessage.mediaKey,
      },
    };
  }

  if (msg.locationMessage) {
    return {
      messageType: 'locationMessage',
      textContent: msg.locationMessage.name || null,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        degreesLatitude: msg.locationMessage.degreesLatitude,
        degreesLongitude: msg.locationMessage.degreesLongitude,
        address: msg.locationMessage.address,
      },
    };
  }

  if (msg.contactMessage) {
    return {
      messageType: 'contactMessage',
      textContent: msg.contactMessage.displayName || null,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        vcard: msg.contactMessage.vcard,
      },
    };
  }

  if (msg.contactsArrayMessage) {
    return {
      messageType: 'contactsArrayMessage',
      textContent: msg.contactsArrayMessage.displayName || null,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        contacts: msg.contactsArrayMessage.contacts,
      },
    };
  }

  if (msg.reactionMessage) {
    return {
      messageType: 'reactionMessage',
      textContent: msg.reactionMessage.text || null,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        key: msg.reactionMessage.key,
      },
    };
  }

  if (msg.pollCreationMessage || msg.pollCreationMessageV3) {
    const pollMsg = msg.pollCreationMessage || msg.pollCreationMessageV3;
    return {
      messageType: 'pollCreationMessage',
      textContent: pollMsg?.name || null,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        options: pollMsg?.options,
        selectableOptionsCount: pollMsg?.selectableOptionsCount,
      },
    };
  }

  if (msg.pollUpdateMessage) {
    return {
      messageType: 'pollUpdateMessage',
      textContent: null,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        pollCreationMessageKey: msg.pollUpdateMessage.pollCreationMessageKey,
        vote: msg.pollUpdateMessage.vote,
      },
    };
  }

  if (msg.liveLocationMessage) {
    return {
      messageType: 'liveLocationMessage',
      textContent: msg.liveLocationMessage.caption || null,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        degreesLatitude: msg.liveLocationMessage.degreesLatitude,
        degreesLongitude: msg.liveLocationMessage.degreesLongitude,
        accuracyInMeters: msg.liveLocationMessage.accuracyInMeters,
        speedInMps: msg.liveLocationMessage.speedInMps,
      },
    };
  }

  if (msg.interactiveMessage) {
    return {
      messageType: 'interactiveMessage',
      textContent: msg.interactiveMessage.header?.title || null,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        header: msg.interactiveMessage.header,
        body: msg.interactiveMessage.body,
        footer: msg.interactiveMessage.footer,
        nativeFlowMessage: msg.interactiveMessage.nativeFlowMessage,
      },
    };
  }

  if (msg.buttonsMessage) {
    return {
      messageType: 'buttonsMessage',
      textContent: msg.buttonsMessage.contentText || null,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        buttons: msg.buttonsMessage.buttons,
        headerType: msg.buttonsMessage.headerType,
        footerText: msg.buttonsMessage.footerText,
      },
    };
  }

  if (msg.listMessage) {
    return {
      messageType: 'listMessage',
      textContent: msg.listMessage.description || null,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        title: msg.listMessage.title,
        buttonText: msg.listMessage.buttonText,
        sections: msg.listMessage.sections,
        listType: msg.listMessage.listType,
      },
    };
  }

  if (msg.templateMessage) {
    return {
      messageType: 'templateMessage',
      textContent: null,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        hydratedTemplate: msg.templateMessage.hydratedTemplate,
      },
    };
  }

  // List response message (user selected an option from a list)
  if (msg.listResponseMessage) {
    const listResponse = msg.listResponseMessage as {
      title?: string;
      listType?: number;
      singleSelectReply?: {
        selectedRowId?: string;
      };
      description?: string;
    };
    const selectedId = listResponse.singleSelectReply?.selectedRowId || '';
    const title = listResponse.title || '';
    let textContent = '[List Response]';
    if (title && selectedId)
      textContent = `[List Response] ${title}\n📋 ID: ${selectedId}`;
    else if (title) textContent = `[List Response] ${title}`;
    else if (selectedId) textContent = `[List Response] ID: ${selectedId}`;
    return {
      messageType: 'listResponseMessage',
      textContent,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        title: listResponse.title,
        description: listResponse.description,
        selectedRowId: selectedId,
        listType: listResponse.listType,
      },
    };
  }

  // Buttons response message (user clicked a button)
  if (msg.buttonsResponseMessage) {
    const buttonResponse = msg.buttonsResponseMessage as {
      selectedButtonId?: string;
      selectedDisplayText?: string;
      type?: number;
    };
    const buttonId = buttonResponse.selectedButtonId || '';
    const buttonText = buttonResponse.selectedDisplayText || '';
    let textContent = '[Button Response]';
    if (buttonText && buttonId)
      textContent = `[Button Response] ${buttonText}\n🔘 ID: ${buttonId}`;
    else if (buttonText) textContent = `[Button Response] ${buttonText}`;
    else if (buttonId) textContent = `[Button Response] ID: ${buttonId}`;
    return {
      messageType: 'buttonsResponseMessage',
      textContent,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        selectedButtonId: buttonId,
        selectedDisplayText: buttonText,
        type: buttonResponse.type,
      },
    };
  }

  // Template button reply message
  if (msg.templateButtonReplyMessage) {
    const templateReply = msg.templateButtonReplyMessage as {
      selectedId?: string;
      selectedDisplayText?: string;
      selectedIndex?: number;
    };
    const selectedId = templateReply.selectedId || '';
    const selectedText = templateReply.selectedDisplayText || '';
    let textContent = '[Template Response]';
    if (selectedText && selectedId)
      textContent = `[Template Response] ${selectedText}\n📝 ID: ${selectedId}`;
    else if (selectedText) textContent = `[Template Response] ${selectedText}`;
    else if (selectedId) textContent = `[Template Response] ID: ${selectedId}`;
    return {
      messageType: 'templateButtonReplyMessage',
      textContent,
      mediaUrl: null,
      fileLength: null,
      metadata: {
        selectedId,
        selectedDisplayText: selectedText,
        selectedIndex: templateReply.selectedIndex,
      },
    };
  }

  return {
    messageType: 'unknown',
    textContent: null,
    mediaUrl: null,
    fileLength: null,
    metadata: { raw: msg },
  };
}
