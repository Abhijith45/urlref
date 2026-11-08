import { RESERVED_ALIASES_SET } from '@shortener/shared';
import { ValidationError } from '../../errors/app-error';

/**
 * Validates custom short aliases for length, allowed character sets, and system reserved routes.
 */
export function validateCustomAlias(alias: string): string {
  if (!alias || typeof alias !== 'string') {
    throw new ValidationError('Custom alias is required');
  }

  const trimmed = alias.trim();

  if (trimmed.length < 3 || trimmed.length > 32) {
    throw new ValidationError('Custom alias must be between 3 and 32 characters');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new ValidationError(
      'Custom alias can only contain alphanumeric characters, hyphens, and underscores',
    );
  }

  if (RESERVED_ALIASES_SET.has(trimmed.toLowerCase())) {
    throw new ValidationError('This custom alias is reserved by the application');
  }

  return trimmed;
}
