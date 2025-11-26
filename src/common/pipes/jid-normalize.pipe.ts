import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * Pipe that normalizes WhatsApp JIDs to ensure consistent format.
 *
 * Handles:
 * - Adding @s.whatsapp.net suffix for individual contacts
 * - Adding @g.us suffix for groups
 * - Removing + prefix from phone numbers
 * - Removing spaces and special characters
 *
 * @example
 * ```typescript
 * @Get(':jid')
 * async getContact(@Param('jid', JidNormalizePipe) jid: string) {}
 * ```
 */
@Injectable()
export class JidNormalizePipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) return value;

    // If already a valid JID, return as-is
    if (value.includes('@')) {
      return value;
    }

    // Clean the input
    let cleaned = value
      .replace(/\+/g, '') // Remove +
      .replace(/[\s-()]/g, '') // Remove spaces, dashes, parentheses
      .trim();

    // Determine suffix based on format
    // Group IDs typically start with numbers and are longer
    const isGroupId = cleaned.length > 15 && /^\d+$/.test(cleaned);

    if (isGroupId) {
      return `${cleaned}@g.us`;
    }

    return `${cleaned}@s.whatsapp.net`;
  }
}

/**
 * Pipe that normalizes group JIDs specifically.
 * Always adds @g.us suffix if not present.
 */
@Injectable()
export class GroupJidNormalizePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value) return value;

    if (value.endsWith('@g.us')) {
      return value;
    }

    // Remove any existing suffix
    const cleaned = value.replace(/@.*$/, '');
    return `${cleaned}@g.us`;
  }
}
