import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getUsersTable, getSessionsTable, UserEntity, SessionEntity } from './storage';

// SECURITY: JWT_SECRET must be set in environment - no fallback allowed
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set. Application cannot start without a secure secret.');
}
if (JWT_SECRET.length < 32) {
  throw new Error('CRITICAL: JWT_SECRET must be at least 32 characters long for security.');
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Password strength requirements
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export const validatePasswordStrength = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
};

// Input sanitization for Azure Table Storage queries (prevent NoSQL injection)
const sanitizeForTableQuery = (input: string): string => {
  // Validate UUID format for id fields
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(input)) {
    throw new Error('Invalid identifier format');
  }
  // Escape single quotes by doubling them (Azure Table Storage OData syntax)
  return input.replace(/'/g, "''");
};

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

export const generateVerificationToken = (): string => {
  return uuidv4();
};

export const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// User operations
export const createUser = async (
  email: string,
  password: string,
  fullName: string
): Promise<UserEntity> => {
  const usersTable = await getUsersTable();
  const normalizedEmail = normalizeEmail(email);
  const id = uuidv4();
  const passwordHash = await hashPassword(password);
  const emailVerificationToken = generateVerificationToken();
  const now = new Date().toISOString();

  const user: UserEntity = {
    partitionKey: 'users',
    rowKey: normalizedEmail,
    id,
    email: normalizedEmail,
    passwordHash,
    fullName,
    emailVerified: false,
    emailVerificationToken,
    createdAt: now,
    updatedAt: now,
  };

  await usersTable.createEntity(user);
  return user;
};

export const getUserByEmail = async (email: string): Promise<UserEntity | null> => {
  const usersTable = await getUsersTable();
  const normalizedEmail = normalizeEmail(email);

  try {
    const user = await usersTable.getEntity<UserEntity>('users', normalizedEmail);
    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string): Promise<UserEntity | null> => {
  const usersTable = await getUsersTable();

  try {
    // SECURITY: Validate and sanitize input to prevent NoSQL injection
    const sanitizedId = sanitizeForTableQuery(id);
    const entities = usersTable.listEntities<UserEntity>({
      queryOptions: { filter: `id eq '${sanitizedId}'` },
    });

    for await (const entity of entities) {
      return entity;
    }
    return null;
  } catch {
    return null;
  }
};

export const updateUser = async (
  email: string,
  updates: Partial<UserEntity>
): Promise<UserEntity | null> => {
  const usersTable = await getUsersTable();
  const normalizedEmail = normalizeEmail(email);

  try {
    const user = await usersTable.getEntity<UserEntity>('users', normalizedEmail);
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await usersTable.updateEntity(updatedUser, 'Replace');
    return updatedUser;
  } catch {
    return null;
  }
};

export const verifyUserEmail = async (token: string): Promise<UserEntity | null> => {
  const usersTable = await getUsersTable();

  try {
    // SECURITY: Validate and sanitize token to prevent NoSQL injection
    const sanitizedToken = sanitizeForTableQuery(token);
    const entities = usersTable.listEntities<UserEntity>({
      queryOptions: { filter: `emailVerificationToken eq '${sanitizedToken}'` },
    });

    for await (const entity of entities) {
      const updatedUser = await updateUser(entity.email, {
        emailVerified: true,
        emailVerificationToken: undefined,
      });
      return updatedUser;
    }
    return null;
  } catch {
    return null;
  }
};

// Session management
export const createSession = async (
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<SessionEntity> => {
  const sessionsTable = await getSessionsTable();
  const sessionId = uuidv4();
  const refreshToken = uuidv4();
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const session: SessionEntity = {
    partitionKey: 'sessions',
    rowKey: sessionId,
    userId,
    refreshToken,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    userAgent,
    ipAddress,
  };

  await sessionsTable.createEntity(session);
  return session;
};

export const validateSession = async (sessionId: string): Promise<SessionEntity | null> => {
  const sessionsTable = await getSessionsTable();

  try {
    const session = await sessionsTable.getEntity<SessionEntity>('sessions', sessionId);

    if (new Date(session.expiresAt) < new Date()) {
      await sessionsTable.deleteEntity('sessions', sessionId);
      return null;
    }

    return session;
  } catch {
    return null;
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const sessionsTable = await getSessionsTable();
  try {
    await sessionsTable.deleteEntity('sessions', sessionId);
  } catch {
    // Ignore if not found
  }
};

// Middleware helper
export const authenticateRequest = async (
  authHeader: string | undefined
): Promise<{ user: UserEntity; payload: JwtPayload } | null> => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  const user = await getUserById(payload.userId);
  if (!user || !user.emailVerified) {
    return null;
  }

  return { user, payload };
};
