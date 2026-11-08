import * as argon2 from 'argon2';
import { logger } from '../../utils/logger';

export class PasswordService {
  /**
   * Hashes a password using Argon2id with memory, time, and parallelism parameters.
   */
  public static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,       // 3 iterations
      parallelism: 4,    // 4 threads
    });
  }

  /**
   * Verifies a password against an Argon2id hash using constant-time comparison.
   */
  public static async verifyPassword(hash: string, plaintext: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plaintext);
    } catch (error) {
      logger.error({ error }, 'Error during password verification');
      return false;
    }
  }
}
