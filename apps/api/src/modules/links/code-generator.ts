import * as crypto from 'crypto';
import { BASE62_ALPHABET, DEFAULT_SHORT_CODE_LENGTH } from '@shortener/shared';

const ALPHABET_LENGTH = BASE62_ALPHABET.length; // 62

/**
 * Generates an unbiased, cryptographically secure Base62 short code.
 * Uses crypto.randomInt which uniformly samples integers with zero modulo bias.
 */
export function generateShortCode(length = DEFAULT_SHORT_CODE_LENGTH): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, ALPHABET_LENGTH);
    result += BASE62_ALPHABET[randomIndex];
  }
  return result;
}
