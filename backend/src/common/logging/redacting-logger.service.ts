import { ConsoleLogger } from '@nestjs/common';

/**
 * Fields that must never reach application logs in plaintext: money amounts,
 * secrets, and raw customer message bodies (which may contain the above,
 * addresses, or other PII). This is a defense-in-depth net on top of not
 * logging these fields deliberately in the first place.
 */
const REDACT_KEYS = new Set([
  'creditLimit',
  'credit_limit',
  'currentBalance',
  'current_balance',
  'price',
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'accessToken',
  'access_token',
  'apiKey',
  'api_key',
  'authorization',
  'rawMessage',
  'raw_message',
]);

const REDACTED = '[REDACTED]';

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = REDACT_KEYS.has(key) ? REDACTED : redact(val, depth + 1);
  }
  return out;
}

/**
 * Drop-in replacement for Nest's default logger. Any object-shaped log
 * argument is scanned and known-sensitive keys are masked before printing.
 */
export class RedactingLogger extends ConsoleLogger {
  private sanitize(message: unknown): unknown {
    if (typeof message === 'string') return message;
    return redact(message);
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    super.log(this.sanitize(message) as any, ...optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    super.error(this.sanitize(message) as any, ...optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    super.warn(this.sanitize(message) as any, ...optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]) {
    super.debug(this.sanitize(message) as any, ...optionalParams);
  }
}
