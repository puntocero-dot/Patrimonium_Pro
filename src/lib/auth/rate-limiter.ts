/**
 * Rate Limiter para prevenir ataques de fuerza bruta
 * Implementación en memoria (para producción considerar Redis)
 */

interface RateLimitEntry {
    attempts: number;
    lastAttempt: number;
    blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_CONFIG = {
    maxAttempts: 5, // Máximo de intentos fallidos
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 30 * 60 * 1000, // 30 minutos de bloqueo
};

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // Si no hay entrada, permitir
    if (!entry) {
        rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now });
        return { allowed: true };
    }

    // Si está bloqueado, verificar si ya pasó el tiempo de bloqueo
    if (entry.blockedUntil && entry.blockedUntil > now) {
        const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
        return { allowed: false, retryAfter };
    }

    // Si la ventana de tiempo expiró, reiniciar contador
    if (now - entry.lastAttempt > RATE_LIMIT_CONFIG.windowMs) {
        rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now });
        return { allowed: true };
    }

    // Incrementar intentos
    entry.attempts++;
    entry.lastAttempt = now;

    // Si excedió el límite, bloquear
    if (entry.attempts > RATE_LIMIT_CONFIG.maxAttempts) {
        entry.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs;
        rateLimitStore.set(identifier, entry);
        const retryAfter = Math.ceil(RATE_LIMIT_CONFIG.blockDurationMs / 1000);
        return { allowed: false, retryAfter };
    }

    rateLimitStore.set(identifier, entry);
    return { allowed: true };
}

export function recordFailedAttempt(identifier: string): void {
    checkRateLimit(identifier);
}

export function clearRateLimit(identifier: string): void {
    rateLimitStore.delete(identifier);
}

// Limpiar entradas antiguas cada hora
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.blockedUntil && entry.blockedUntil < now) {
            rateLimitStore.delete(key);
        }
    }
}, 60 * 60 * 1000);
