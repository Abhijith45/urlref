import { prisma } from '../../database/db';
import { PasswordService } from './password.service';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../errors/app-error';
import { RegisterInput, LoginInput, UserDto } from '@shortener/shared';

export class AuthService {
  public static async register(input: RegisterInput): Promise<UserDto> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email address already exists');
    }

    const passwordHash = await PasswordService.hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: 'USER',
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  public static async login(input: LoginInput): Promise<UserDto> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await PasswordService.verifyPassword(user.passwordHash, input.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  public static async getProfile(userId: string): Promise<UserDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User account not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
