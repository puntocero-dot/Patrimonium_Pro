import { hash } from '../encryption/crypto';

/**
 * Sistema de políticas avanzadas de contraseñas
 * - Expiración de contraseñas (90 días para Admin/Contador)
 * - Prevención de reuso de últimas 5 contraseñas
 */

const PASSWORD_EXPIRATION_DAYS = {
    SUPER_ADMIN: 90,
    CONTADOR: 90,
    CLIENTE: 180,
    AUDITOR: 120,
};

const PASSWORD_HISTORY_COUNT = 5;

export interface PasswordHistoryEntry {
    passwordHash: string;
    changedAt: Date;
}

export interface PasswordPolicy {
    expirationDays: number;
    historyCount: number;
    requireComplexity: boolean;
}

/**
 * Obtiene la política de contraseñas según el rol
 */
export function getPasswordPolicy(role: string): PasswordPolicy {
    const expirationDays = PASSWORD_EXPIRATION_DAYS[role as keyof typeof PASSWORD_EXPIRATION_DAYS] || 180;

    return {
        expirationDays,
        historyCount: PASSWORD_HISTORY_COUNT,
        requireComplexity: true,
    };
}

/**
 * Verifica si la contraseña ha expirado
 */
export function isPasswordExpired(
    lastChangedAt: Date,
    role: string
): boolean {
    const policy = getPasswordPolicy(role);
    const expirationDate = new Date(lastChangedAt);
    expirationDate.setDate(expirationDate.getDate() + policy.expirationDays);

    return new Date() > expirationDate;
}

/**
 * Calcula días restantes hasta expiración
 */
export function getDaysUntilExpiration(
    lastChangedAt: Date,
    role: string
): number {
    const policy = getPasswordPolicy(role);
    const expirationDate = new Date(lastChangedAt);
    expirationDate.setDate(expirationDate.getDate() + policy.expirationDays);

    const daysRemaining = Math.ceil(
        (expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(0, daysRemaining);
}

/**
 * Verifica si la contraseña fue usada recientemente
 */
export function isPasswordReused(
    newPassword: string,
    passwordHistory: PasswordHistoryEntry[]
): boolean {
    const newPasswordHash = hash(newPassword);

    // Verificar contra las últimas N contraseñas
    const recentPasswords = passwordHistory.slice(0, PASSWORD_HISTORY_COUNT);

    return recentPasswords.some(
        entry => entry.passwordHash === newPasswordHash
    );
}

/**
 * Agrega una contraseña al historial
 */
export function addToPasswordHistory(
    password: string,
    currentHistory: PasswordHistoryEntry[]
): PasswordHistoryEntry[] {
    const newEntry: PasswordHistoryEntry = {
        passwordHash: hash(password),
        changedAt: new Date(),
    };

    // Mantener solo las últimas N contraseñas
    const updatedHistory = [newEntry, ...currentHistory].slice(
        0,
        PASSWORD_HISTORY_COUNT
    );

    return updatedHistory;
}

/**
 * Verifica si el usuario necesita cambiar su contraseña
 */
export function requiresPasswordChange(
    lastChangedAt: Date,
    role: string
): { required: boolean; reason?: string; daysRemaining?: number } {
    if (isPasswordExpired(lastChangedAt, role)) {
        return {
            required: true,
            reason: 'password_expired',
        };
    }

    const daysRemaining = getDaysUntilExpiration(lastChangedAt, role);

    // Advertir si faltan menos de 7 días
    if (daysRemaining <= 7) {
        return {
            required: false,
            reason: 'password_expiring_soon',
            daysRemaining,
        };
    }

    return { required: false };
}

/**
 * Valida el cambio de contraseña
 */
export function validatePasswordChange(
    newPassword: string,
    passwordHistory: PasswordHistoryEntry[]
): { valid: boolean; error?: string } {
    // Verificar reutilización
    if (isPasswordReused(newPassword, passwordHistory)) {
        return {
            valid: false,
            error: 'No puedes usar una de tus últimas 5 contraseñas',
        };
    }

    return { valid: true };
}
