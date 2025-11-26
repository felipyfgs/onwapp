/**
 * Parse media input (URL, base64 data URI, or raw base64) into uploadable format
 */
export function parseMediaBuffer(media: string): { url: string } | Buffer {
  if (media.startsWith('http://') || media.startsWith('https://')) {
    return { url: media };
  }

  if (media.startsWith('data:')) {
    const base64Data = media.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  }

  return Buffer.from(media, 'base64');
}

/**
 * WhatsApp message content type definition
 */
export interface WAMessageContent {
  imageMessage?: { caption?: string; url?: string };
  videoMessage?: { caption?: string; url?: string };
  audioMessage?: { ptt?: boolean; url?: string };
  documentMessage?: { fileName?: string; url?: string };
  stickerMessage?: { url?: string };
  conversation?: string;
  extendedTextMessage?: { text?: string };
  contactMessage?: Record<string, unknown>;
  locationMessage?: Record<string, unknown>;
  liveLocationMessage?: Record<string, unknown>;
  listMessage?: Record<string, unknown>;
  listResponseMessage?: Record<string, unknown>;
  buttonsResponseMessage?: Record<string, unknown>;
  templateButtonReplyMessage?: Record<string, unknown>;
  reactionMessage?: { text?: string };
}

/**
 * Get file extension based on WhatsApp message type
 */
export function getMediaExtension(
  message: WAMessageContent | Record<string, unknown> | null | undefined,
): string {
  if (!message) return 'bin';

  if (message.imageMessage) return 'jpg';
  if (message.videoMessage) return 'mp4';
  if (message.audioMessage) {
    const audio = message.audioMessage as { ptt?: boolean };
    return audio.ptt ? 'ogg' : 'mp3';
  }
  if (message.documentMessage) {
    const doc = message.documentMessage as { fileName?: string };
    const fileName = doc.fileName || '';
    const ext = fileName.split('.').pop();
    return ext || 'bin';
  }
  if (message.stickerMessage) return 'webp';

  return 'bin';
}

/**
 * Extract media URL from WhatsApp message
 */
export function extractMediaUrl(
  message: WAMessageContent | Record<string, unknown> | null | undefined,
): string | null {
  if (!message) return null;

  const mediaTypes = [
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'documentMessage',
    'stickerMessage',
  ] as const;

  for (const type of mediaTypes) {
    const mediaMsg = message[type] as { url?: string } | undefined;
    if (mediaMsg?.url) {
      return mediaMsg.url;
    }
  }

  return null;
}

/**
 * Get media type string from WhatsApp message
 */
export function getMediaType(
  message: WAMessageContent | Record<string, unknown> | null | undefined,
): string | null {
  if (!message) return null;

  if (message.imageMessage) return 'image';
  if (message.videoMessage) return 'video';
  if (message.audioMessage) return 'audio';
  if (message.documentMessage) return 'document';
  if (message.stickerMessage) return 'sticker';

  return null;
}

/**
 * Check if message contains media
 */
export function isMediaMessage(
  message: WAMessageContent | Record<string, unknown> | null | undefined,
): boolean {
  if (!message) return false;

  return !!(
    message.imageMessage ||
    message.videoMessage ||
    message.audioMessage ||
    message.documentMessage ||
    message.stickerMessage
  );
}

/**
 * Get filename for media message
 */
export function getMediaFilename(
  message: WAMessageContent | Record<string, unknown> | null | undefined,
  messageId: string,
): string {
  if (message?.documentMessage) {
    const doc = message.documentMessage as { fileName?: string };
    if (doc.fileName) return doc.fileName;
  }

  const extension = getMediaExtension(message);
  return `${messageId}.${extension}`;
}

/**
 * Get MIME type from file type or extension
 * Comprehensive mapping for common file types
 */
export function getMimeType(fileType: string, fileName?: string): string {
  const ext = fileName?.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    // Chatwoot file types
    image: 'image/jpeg',
    video: 'video/mp4',
    audio: 'audio/mpeg',
    file: 'application/octet-stream',

    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    tiff: 'image/tiff',
    tif: 'image/tiff',

    // Videos
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    '3gp': 'video/3gpp',

    // Audio
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    flac: 'audio/flac',
    m4a: 'audio/mp4',
    wma: 'audio/x-ms-wma',
    opus: 'audio/opus',

    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    odt: 'application/vnd.oasis.opendocument.text',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    odp: 'application/vnd.oasis.opendocument.presentation',
    rtf: 'application/rtf',
    txt: 'text/plain',
    csv: 'text/csv',

    // Archives
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',

    // Code/Data
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',

    // Other
    apk: 'application/vnd.android.package-archive',
    exe: 'application/x-msdownload',
    dmg: 'application/x-apple-diskimage',
  };

  // Try extension first, then file type
  return (
    mimeTypes[ext || ''] || mimeTypes[fileType] || 'application/octet-stream'
  );
}
