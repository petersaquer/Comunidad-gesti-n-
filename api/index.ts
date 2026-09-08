import express from 'express';
import path from 'path';
import {
  getAllAppStateFromSQLite,
  saveAllAppStateToSQLite,
  executeCustomSQLQuery,
  getSQLiteStats,
  resetSQLiteDatabase,
  getDatabasePath,
  findUserForAuth,
  updateUserPasswordInDB,
  registerNewUserInDB,
} from '../server/sqliteDb';
import {
  verifyPassword,
  hashPassword,
  sanitizeUser,
  createSessionToken,
  verifySessionToken,
  checkRateLimit,
  resetRateLimit,
  SessionPayload,
} from '../server/authSecurity';

const app = express();

// Hardening middleware
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; img-src 'self' data: https: blob:; connect-src 'self' https: ws: wss:;"
  );
  next();
});
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Auth Middleware (from server.ts)
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: 'Acceso denegado: Token requerido' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const payload = verifySessionToken(token);
    if (!payload) {
      res.status(401).json({ success: false, error: 'Acceso denegado: Token inválido o expirado' });
      return;
    }
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Error de autenticación' });
  }
};

const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  requireAuth(req, res, () => {
    const payload = (req as any).user as SessionPayload;
    if (payload.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Acceso denegado: Permisos de Administrador Requeridos' });
      return;
    }
    next();
  });
};

// API Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { documentId, password } = req.body;
    if (!documentId || !password) {
      res.status(400).json({ success: false, error: 'Credenciales incompletas' });
      return;
    }
    const { allowed, remainingAttempts } = checkRateLimit(`login_${documentId}`);
    if (!allowed) {
      res.status(429).json({ success: false, error: 'Demasiados intentos fallidos. Intente nuevamente en 15 minutos.' });
      return;
    }
    const userRes = findUserForAuth(documentId);
    if (!userRes) {
      res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos', attemptsRemaining: remainingAttempts });
      return;
    }
    const isValid = verifyPassword(password, userRes.storedPasswordHash);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos', attemptsRemaining: remainingAttempts });
      return;
    }
    resetRateLimit(`login_${documentId}`);
    const token = createSessionToken(userRes.user);
    res.json({ success: true, token, user: sanitizeUser(userRes.user), timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: 'Error interno del servidor de autenticación' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { documentId, fullName, phone, email, password } = req.body;
    if (!documentId || !fullName || !password) {
      res.status(400).json({ success: false, error: 'Faltan datos obligatorios para el registro' });
      return;
    }
    const hashedPassword = hashPassword(password);
    const newUser: any = { id: `user_${Date.now()}`, documentId, fullName, phone, email, role: 'residente' };
    const success = registerNewUserInDB(newUser, hashedPassword);
    if (!success) {
      throw new Error('No se pudo registrar');
    }
    const token = createSessionToken(newUser);
    res.json({ success: true, token, user: sanitizeUser(newUser), timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error interno al registrar usuario';
    res.status(400).json({ success: false, error: errorMsg });
  }
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Debe proveer la contraseña actual y la nueva' });
      return;
    }
    const payload = (req as any).user as SessionPayload;
    const userRes = findUserForAuth(payload.documentId);
    if (!userRes) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }
    const isValid = verifyPassword(currentPassword, userRes.storedPasswordHash);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'La contraseña actual es incorrecta' });
      return;
    }
    const hashedNew = hashPassword(newPassword);
    updateUserPasswordInDB(userRes.user.id, hashedNew);
    res.json({ success: true, message: 'Contraseña actualizada con éxito (Cifrada con scrypt)' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error interno al cambiar contraseña';
    res.status(500).json({ success: false, error: errorMsg });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ComunidApp - Gestión Comunitaria INDERT (SQLite 3 Engine)',
    database: 'SQLite 3 (sector16.sqlite)',
    security: {
      engine: 'Node.js Cryptographic Vault (scrypt + HMAC-SHA256)',
      firewall: 'SQL Injection AST Filter & Sensitive Data Redaction Active',
      bruteForceProtection: 'Active (Rate Limit 5/15m)',
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/state', (_req, res) => {
  try {
    const state = getAllAppStateFromSQLite();
    res.json({ success: true, source: 'sqlite', database: 'sector16.sqlite', timestamp: new Date().toISOString(), data: state });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error al cargar datos desde SQLite';
    res.status(500).json({ success: false, error: errorMsg });
  }
});

app.post('/api/state', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ success: false, error: 'Datos no válidos' });
      return;
    }
    saveAllAppStateToSQLite(payload);
    res.json({ success: true, message: 'Estado sincronizado y guardado con éxito en SQLite (sector16.sqlite)', timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error al guardar datos en SQLite';
    res.status(500).json({ success: false, error: errorMsg });
  }
});

app.get('/api/sqlite/stats', (_req, res) => {
  try {
    const stats = getSQLiteStats();
    res.json({ success: true, ...stats });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error al obtener estadísticas de SQLite';
    res.status(500).json({ success: false, error: errorMsg });
  }
});

app.post('/api/sqlite/query', requireAdminAuth, (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ success: false, error: 'Consulta SQL vacía o requerida' });
      return;
    }
    const result = executeCustomSQLQuery(query);
    res.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error al ejecutar consulta SQL';
    res.status(400).json({ success: false, error: errorMsg });
  }
});

app.post('/api/sqlite/reset', requireAdminAuth, (_req, res) => {
  try {
    const freshState = resetSQLiteDatabase();
    res.json({ success: true, message: 'Base de datos SQLite restablecida a los datos iniciales de demostración', data: freshState });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error al restablecer base de datos SQLite';
    res.status(500).json({ success: false, error: errorMsg });
  }
});

app.post('/api/backup', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'Formato de datos no válido' });
      return;
    }
    saveAllAppStateToSQLite(payload);
    res.json({ success: true, message: 'Respaldo recibido y almacenado en SQLite correctamente' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error al procesar el respaldo';
    res.status(500).json({ error: errorMsg });
  }
});

export default app;
