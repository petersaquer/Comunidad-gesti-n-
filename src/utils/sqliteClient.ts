// Client-side SQLite synchronization and query helper for Sector 16 with cryptographic security headers
import { UserAccount } from '../types';

export interface SQLiteStats {
  databaseName: string;
  filePath: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  journalMode: string;
  sqliteVersion: string;
  engine: string;
  tables: Array<{ name: string; label: string; count: number }>;
  totalRecords: number;
  timestamp: string;
}

export interface SQLQueryResult {
  success: boolean;
  isSelect?: boolean;
  columns?: string[];
  rows?: any[];
  rowCount?: number;
  changes?: number;
  lastInsertRowid?: string | null;
  message?: string;
  error?: string;
  timestamp?: string;
}

export interface SecurityAuditReport {
  status: string;
  score: string;
  protections: Array<{
    name: string;
    status: string;
    detail: string;
  }>;
  timestamp: string;
}

const TOKEN_STORAGE_KEY = 'comunidapp_session_token_v1';

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (err) {
    console.error('Error saving auth token to localStorage:', err);
  }
}

export function clearStoredAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// Fetch complete app state from the backend SQLite database (passwords stripped for privacy)
export async function fetchStateFromSQLite(): Promise<any | null> {
  try {
    const res = await fetch('/api/state');
    if (!res.ok) {
      console.warn('[SQLite Client] No se pudo obtener estado de SQLite, usando caché local.');
      return null;
    }
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.warn('[SQLite Client] Error conectando con API SQLite:', err);
    return null;
  }
}

// Synchronize application state back to SQLite database
let syncTimeout: any = null;

export function syncStateToSQLite(appState: any, immediate = false): Promise<boolean> {
  return new Promise((resolve) => {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
    }

    const doSync = async () => {
      try {
        const token = getStoredAuthToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/state', {
          method: 'POST',
          headers,
          body: JSON.stringify(appState),
        });
        const data = await res.json();
        resolve(data.success);
      } catch (err) {
        console.error('[SQLite Client] Error sincronizando con SQLite:', err);
        resolve(false);
      }
    };

    if (immediate) {
      doSync();
    } else {
      syncTimeout = setTimeout(doSync, 600);
    }
  });
}

// Fetch SQLite live statistics and table row counts
export async function fetchSQLiteStats(): Promise<SQLiteStats | null> {
  try {
    const res = await fetch('/api/sqlite/stats');
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[SQLite Client] Error obteniendo métricas SQLite:', err);
    return null;
  }
}

// Execute arbitrary SQL query via the admin console (Protected by Token & Firewall)
export async function runSQLQuery(query: string): Promise<SQLQueryResult> {
  try {
    const token = getStoredAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/sqlite/query', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error de red al ejecutar consulta';
    return {
      success: false,
      error: errorMsg,
    };
  }
}

// Reset SQLite database to seed data (Protected)
export async function resetSQLiteOnServer(): Promise<any | null> {
  try {
    const token = getStoredAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/sqlite/reset', {
      method: 'POST',
      headers,
    });
    const data = await res.json();
    if (data.success && data.data) {
      return data.data;
    }
    return null;
  } catch (err) {
    console.error('[SQLite Client] Error al reiniciar SQLite:', err);
    return null;
  }
}

// Get the download URL for sector16.sqlite (with authorization token)
export function getSQLiteDownloadUrl(): string {
  const token = getStoredAuthToken();
  return token ? `/api/sqlite/download?token=${encodeURIComponent(token)}` : '/api/sqlite/download';
}

// Fetch Security Audit Report
export async function fetchSecurityAudit(): Promise<SecurityAuditReport | null> {
  try {
    const res = await fetch('/api/security/audit');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Server-Side Authentication APIs
 */
export async function loginWithServer(
  documentId: string,
  password?: string
): Promise<{ success: boolean; user?: UserAccount; token?: string; error?: string; remainingAttempts?: number }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, password: password || '' }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      setStoredAuthToken(data.token);
      return { success: true, user: data.user, token: data.token };
    }
    return {
      success: false,
      error: data.error || 'Error al autenticar credenciales',
      remainingAttempts: data.remainingAttempts,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error de conexión con el servidor de autenticación';
    return { success: false, error: errorMsg };
  }
}

export async function changePasswordOnServer(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const token = getStoredAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers,
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    return data;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error de red al actualizar contraseña';
    return { success: false, error: errorMsg };
  }
}

export async function registerOnServer(
  userData: Partial<UserAccount>,
  password: string
): Promise<{ success: boolean; user?: UserAccount; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, password }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      setStoredAuthToken(data.token);
      return { success: true, user: data.user, token: data.token };
    }
    return { success: false, error: data.error || 'Error al registrar usuario' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error de red al registrar usuario';
    return { success: false, error: errorMsg };
  }
}
