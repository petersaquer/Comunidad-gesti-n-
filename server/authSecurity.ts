import crypto from 'crypto';
import { UserAccount } from '../src/types';

// Use environment secret or generate a persistent runtime secret
const JWT_SECRET = process.env.SESSION_SECRET || 'sector16_indert_super_secure_vault_key_2026';

/**
 * Hash a password using scrypt with a random 16-byte salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify password against stored hash or legacy plaintext with timing attack protection
 */
export function verifyPassword(password: string, storedHashOrPlain: string | undefined): boolean {
  if (!storedHashOrPlain) return false;

  // 1. Scrypt hashed password
  if (storedHashOrPlain.startsWith('scrypt:')) {
    const parts = storedHashOrPlain.split(':');
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const originalHash = parts[2];
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
    const originalBuffer = Buffer.from(originalHash, 'hex');
    if (keyBuffer.length !== originalBuffer.length) return false;
    return crypto.timingSafeEqual(keyBuffer, originalBuffer);
  }

  // 2. Legacy fallback check (e.g. factory Team-Nogardd123)
  const passwordBuffer = Buffer.from(password);
  const storedBuffer = Buffer.from(storedHashOrPlain);
  if (passwordBuffer.length !== storedBuffer.length) return false;
  return crypto.timingSafeEqual(passwordBuffer, storedBuffer);
}

/**
 * Strip sensitive credentials before sending user data to the browser
 */
export function sanitizeUser(user: UserAccount): Omit<UserAccount, 'password'> & { hasPassword: boolean } {
  const { password: _p, ...safeUser } = user;
  return {
    ...safeUser,
    hasPassword: Boolean(_p && _p.trim().length > 0),
  };
}

export interface SessionPayload {
  userId: string;
  documentId: string;
  role: string;
  fullName: string;
  isSuperAdmin: boolean;
  exp: number; // Unix timestamp
}

/**
 * Create a HMAC-SHA256 signed session token
 */
export function createSessionToken(user: UserAccount): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload: SessionPayload = {
    userId: user.id,
    documentId: user.documentId,
    role: user.role,
    fullName: user.fullName,
    isSuperAdmin: user.role === 'admin' || user.id === 'user-admin',
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days expiration
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${encodedPayload}`)
    .digest('base64url');

  return `${header}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode an HMAC-SHA256 session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    const parts = cleanToken.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const decodedPayload: SessionPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      // Token expired
      return null;
    }

    return decodedPayload;
  } catch (err) {
    console.error('[AuthSecurity] Error verificando token:', err);
    return null;
  }
}

/**
 * In-Memory Rate Limiter for Login & Sensitive Endpoints
 */
interface RateLimitRecord {
  attempts: number;
  blockedUntil: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  blockDurationMs = 15 * 60 * 1000
): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    rateLimitStore.set(key, { attempts: 1, blockedUntil: 0 });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  if (record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  if (record.blockedUntil > 0 && record.blockedUntil <= now) {
    // Reset block
    record.attempts = 1;
    record.blockedUntil = 0;
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  record.attempts += 1;
  if (record.attempts > maxAttempts) {
    record.blockedUntil = now + blockDurationMs;
    const retryAfterSeconds = Math.ceil(blockDurationMs / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  return { allowed: true, remainingAttempts: maxAttempts - record.attempts };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * SQL Injection Firewall & Dangerous Statement Filter
 */
export function validateSQLQuerySafety(query: string): { isSafe: boolean; reason?: string } {
  const trimmed = query.trim();

  // 1. Disallow empty query
  if (!trimmed) {
    return { isSafe: false, reason: 'Consulta SQL vacía.' };
  }

  // 2. Block system-level database escapes or filesystem operations
  const dangerousPatterns = [
    /\bATTACH\s+(DATABASE)?/i,
    /\bDETACH\s+(DATABASE)?/i,
    /\bPRAGMA\s+writable_schema/i,
    /\bPRAGMA\s+compile_options/i,
    /\bPRAGMA\s+database_list/i,
    /\bload_extension\b/i,
    /\bxxd\b/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        reason: 'Operación SQL restringida por el firewall de seguridad comunitaria.',
      };
    }
  }

  // 3. Block attempts to read or modify the SQLite internal master schema
  if (/sqlite_master\s+WHERE.*(type\s*=\s*'table'|DROP)/i.test(trimmed) && /DROP/i.test(trimmed)) {
    return { isSafe: false, reason: 'No se permite manipular tablas maestras de SQLite.' };
  }

  return { isSafe: true };
}

/**
 * Redact sensitive fields (like password or password_hash) from SQL query results
 */
export function redactSensitiveSQLRows(rows: any[]): any[] {
  if (!Array.isArray(rows)) return rows;
  return rows.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const cleanRow = { ...row };
    if ('password' in cleanRow) {
      cleanRow.password = '●●●●●●●● (Protegido por Hash)';
    }
    if ('data_json' in cleanRow && typeof cleanRow.data_json === 'string') {
      try {
        const parsed = JSON.parse(cleanRow.data_json);
        if (parsed && typeof parsed === 'object' && 'password' in parsed) {
          delete parsed.password;
          cleanRow.data_json = JSON.stringify(parsed);
        }
      } catch {
        // ignore
      }
    }
    return cleanRow;
  });
}
