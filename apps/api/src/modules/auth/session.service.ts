import { CookieOptions, Response } from 'express';
import * as crypto from 'crypto';
import { env } from '../../config/env';

export interface SessionPayload {
  userId: string;
  role: string;
  createdAt: number;
}

export const SESSION_COOKIE_NAME = 'sid';
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class SessionService {
  /**
   * Generates a signed, tamper-resistant session token.
   */
  public static createSessionToken(userId: string, role: string): string {
    const payload: SessionPayload = {
      userId,
      role,
      createdAt: Date.now(),
    };

    const serialized = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', env.SESSION_SECRET)
      .update(serialized)
      .digest('base64url');

    return `${serialized}.${signature}`;
  }

  /**
   * Verifies a session token and extracts the payload if valid and unexpired.
   */
  public static verifySessionToken(token: string): SessionPayload | null {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [serialized, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', env.SESSION_SECRET)
      .update(serialized)
      .digest('base64url');

    // Constant-time comparison
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    try {
      const payload: SessionPayload = JSON.parse(Buffer.from(serialized, 'base64url').toString('utf8'));

      // Verify expiration (7 days)
      if (Date.now() - payload.createdAt > SESSION_MAX_AGE_MS) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Returns production-hardened cookie options for cross-subdomain hosting.
   */
  public static getCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: env.COOKIE_DOMAIN || undefined,
      maxAge: SESSION_MAX_AGE_MS,
      path: '/',
    };
  }

  /**
   * Sets the session cookie on the outgoing response.
   */
  public static setSessionCookie(res: Response, userId: string, role: string): void {
    const token = this.createSessionToken(userId, role);
    res.cookie(SESSION_COOKIE_NAME, token, this.getCookieOptions());
  }

  /**
   * Clears the session cookie on logout.
   */
  public static clearSessionCookie(res: Response): void {
    const options = this.getCookieOptions();
    res.clearCookie(SESSION_COOKIE_NAME, {
      ...options,
      maxAge: 0,
    });
  }
}
