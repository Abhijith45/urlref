import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { loginSchema, registerSchema } from '@shortener/shared';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = registerSchema.parse(req.body);
      const user = await AuthService.register(validatedInput);

      // Set production-hardened session cookie
      SessionService.setSessionCookie(res, user.id, user.role);

      res.status(201).json({
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = loginSchema.parse(req.body);
      const user = await AuthService.login(validatedInput);

      // Rotate session and set session cookie
      SessionService.setSessionCookie(res, user.id, user.role);

      res.status(200).json({
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      SessionService.clearSessionCookie(res);
      res.status(200).json({
        data: { success: true },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as unknown as { user: { id: string } }).user.id;
      const user = await AuthService.getProfile(userId);

      res.status(200).json({
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
