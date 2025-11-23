import { proto } from 'whaileys';

export interface ParsedMessageContent {
  messageType: string;
  textContent: string | null;
  mediaUrl: string | null;
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
      metadata: {},
    };
  }

  if (msg.conversation) {
    return {
      messageType: 'conversation',
      textContent: msg.conversation,
      mediaUrl: null,
      metadata: {},
    };
  }

  if (msg.extendedTextMessage) {
    return {
      messageType: 'extendedTextMessage',
      textContent: msg.extendedTextMessage.text || null,
      mediaUrl: null,
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
      metadata: {
        mimetype: msg.imageMessage.mimetype,
        fileLength: msg.imageMessage.fileLength?.toString(),
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
      metadata: {
        mimetype: msg.videoMessage.mimetype,
        fileLength: msg.videoMessage.fileLength?.toString(),
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
      metadata: {
        mimetype: msg.audioMessage.mimetype,
        fileLength: msg.audioMessage.fileLength?.toString(),
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
      metadata: {
        mimetype: msg.documentMessage.mimetype,
        fileLength: msg.documentMessage.fileLength?.toString(),
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
      metadata: {
        mimetype: msg.stickerMessage.mimetype,
        fileLength: msg.stickerMessage.fileLength?.toString(),
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
      metadata: {
        hydratedTemplate: msg.templateMessage.hydratedTemplate,
      },
    };
  }

  return {
    messageType: 'unknown',
    textContent: null,
    mediaUrl: null,
    metadata: { raw: msg },
  };
}
