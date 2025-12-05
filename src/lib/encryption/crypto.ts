import crypto from 'crypto';

/**
 * Sistema de encriptación AES-256-GCM para datos sensibles
 * Utiliza el master key del .env como base para derivar claves
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits

const SALT_LENGTH = 64;

/**
 * Obtiene la clave maestra desde las variables de entorno
 */
function getMasterKey(): string {
    const masterKey = process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKey || masterKey.length < 32) {
        throw new Error('ENCRYPTION_MASTER_KEY must be at least 32 characters');
    }
    return masterKey;
}

/**
 * Deriva una clave de encriptación desde la clave maestra usando PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
        masterKey,
        salt,
        100000, // iterations
        KEY_LENGTH,
        'sha512'
    );
}

/**
 * Encripta datos sensibles usando AES-256-GCM
 * @param plaintext - Texto plano a encriptar
 * @returns String en formato: salt:iv:authTag:encrypted (todo en base64)
 */
export function encrypt(plaintext: string): string {
    try {
        const masterKey = getMasterKey();

        // Generar salt e IV aleatorios
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);

        // Derivar clave
        const key = deriveKey(masterKey, salt);

        // Crear cipher
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        // Encriptar
        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        // Obtener authentication tag
        const authTag = cipher.getAuthTag();

        // Combinar todo en un string separado por ':'
        return `${salt.toString('base64')}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Desencripta datos que fueron encriptados con encrypt()
 * @param encryptedData - String en formato: salt:iv:authTag:encrypted
 * @returns Texto plano original
 */
export function decrypt(encryptedData: string): string {
    try {
        const masterKey = getMasterKey();

        // Separar componentes
        const parts = encryptedData.split(':');
        if (parts.length !== 4) {
            throw new Error('Invalid encrypted data format');
        }

        const [saltB64, ivB64, authTagB64, encrypted] = parts;

        // Convertir desde base64
        const salt = Buffer.from(saltB64, 'base64');
        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');

        // Derivar la misma clave
        const key = deriveKey(masterKey, salt);

        // Crear decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        // Desencriptar
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Hash de datos sensibles (one-way) usando SHA-256
 * Útil para datos que solo necesitan verificarse, no recuperarse
 */
export function hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Hash de contraseñas con salt usando PBKDF2
 * Nota: Supabase ya maneja esto, pero útil para campos adicionales
 */
export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

/**
 * Verifica una contraseña contra su hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
    const [salt, originalHash] = storedHash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === originalHash;
}

/**
 * Genera un token aleatorio seguro criptográficamente
 * @param length - Longitud del token en bytes (default: 32)
 */
export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Ofusca datos sensibles para logging (muestra solo primeros/últimos caracteres)
 */
export function maskSensitiveData(data: string, showChars: number = 4): string {
    if (data.length <= showChars * 2) {
        return '*'.repeat(data.length);
    }
    const start = data.substring(0, showChars);
    const end = data.substring(data.length - showChars);
    const masked = '*'.repeat(data.length - showChars * 2);
    return `${start}${masked}${end}`;
}
