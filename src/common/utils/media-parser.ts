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
