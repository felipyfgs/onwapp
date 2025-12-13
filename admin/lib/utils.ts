import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Formats an API key for display by showing only the first and last few characters
 * @param apiKey - The API key to format
 * @param visibleChars - Number of characters to show at the beginning and end (default: 4)
 * @returns Formatted API key string
 */
export function formatApiKey(apiKey: string, visibleChars: number = 4): string {
  if (!apiKey || apiKey.length <= visibleChars * 2) {
    return apiKey;
  }
  const start = apiKey.slice(0, visibleChars);
  const end = apiKey.slice(-visibleChars);
  const middle = '*'.repeat(apiKey.length - visibleChars * 2);
  return `${start}${middle}${end}`;
}

/**
 * Removes all non-digit characters from a phone number
 * @param phoneNumber - The phone number to clean
 * @returns Cleaned phone number with only digits
 */
export function cleanPhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

/**
 * Validates a session name input
 * @param name - The session name to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateSessionName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Session name is required' };
  }

  if (name.trim().length < 3) {
    return { isValid: false, error: 'Session name must be at least 3 characters long' };
  }

  if (name.trim().length > 50) {
    return { isValid: false, error: 'Session name must not exceed 50 characters' };
  }

  // Optional: Check for invalid characters
  const validNamePattern = /^[a-zA-Z0-9\s\-_]+$/;
  if (!validNamePattern.test(name)) {
    return { isValid: false, error: 'Session name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }

  return { isValid: true };
}

/**
 * Validates a phone number input
 * @param phoneNumber - The phone number to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validatePhoneNumber(phoneNumber: string): { isValid: boolean; error?: string } {
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    return { isValid: false, error: 'Phone number is required' };
  }

  const cleaned = cleanPhoneNumber(phoneNumber);

  // Check if phone number has a reasonable length (10-15 digits for international numbers)
  if (cleaned.length < 10) {
    return { isValid: false, error: 'Phone number must be at least 10 digits' };
  }

  if (cleaned.length > 15) {
    return { isValid: false, error: 'Phone number must not exceed 15 digits' };
  }

  // Check if all characters are valid phone number characters after cleaning
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: 'Phone number contains invalid characters' };
  }

  return { isValid: true };
}

/**
 * Copies text to the clipboard with fallback for older browsers
 * @param text - The text to copy
 * @returns Promise that resolves when copy is successful or rejects with error
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    // Use the modern Clipboard API if available
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (!successful) {
      throw new Error('Failed to copy text to clipboard');
    }
  } catch (error) {
    throw new Error(`Could not copy text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
