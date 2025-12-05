import { generateSecureToken, encrypt, decrypt } from '../encryption/crypto';

/**
 * Sistema de backup codes para recuperación de MFA
 */

const BACKUP_CODES_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

export interface BackupCode {
    code: string;
    used: boolean;
    usedAt?: Date;
}

/**
 * Genera códigos de respaldo seguros
 */
export function generateBackupCodes(count: number = BACKUP_CODES_COUNT): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
        // Generar código de 8 caracteres alfanuméricos
        const code = generateSecureToken(4) // 8 caracteres hex
            .substring(0, BACKUP_CODE_LENGTH)
            .toUpperCase();
        codes.push(code);
    }

    return codes;
}

/**
 * Formatea un código para mejor lectura (XXXX-XXXX)
 */
export function formatBackupCode(code: string): string {
    if (code.length !== 8) return code;
    return `${code.substring(0, 4)}-${code.substring(4, 8)}`;
}

/**
 * Encripta y guarda códigos de respaldo
 */
export function encryptBackupCodes(codes: string[]): string {
    const backupData: BackupCode[] = codes.map(code => ({
        code,
        used: false,
    }));

    const dataString = JSON.stringify(backupData);
    return encrypt(dataString);
}

/**
 * Desencripta códigos de respaldo
 */
export function decryptBackupCodes(encryptedCodes: string): BackupCode[] {
    try {
        const decrypted = decrypt(encryptedCodes);
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Error decrypting backup codes:', error);
        return [];
    }
}

/**
 * Verifica un código de respaldo
 */
export function verifyBackupCode(
    encryptedCodes: string,
    inputCode: string
): { valid: boolean; updatedCodes?: string } {
    const codes = decryptBackupCodes(encryptedCodes);
    const normalizedInput = inputCode.replace(/-/g, '').toUpperCase();

    const codeIndex = codes.findIndex(
        c => c.code === normalizedInput && !c.used
    );

    if (codeIndex === -1) {
        return { valid: false };
    }

    // Marcar como usado
    codes[codeIndex].used = true;
    codes[codeIndex].usedAt = new Date();

    // Re-encriptar códigos actualizados
    const updatedEncrypted = encrypt(JSON.stringify(codes));

    return {
        valid: true,
        updatedCodes: updatedEncrypted,
    };
}

/**
 * Cuenta códigos no usados restantes
 */
export function getRemainingBackupCodes(encryptedCodes: string): number {
    const codes = decryptBackupCodes(encryptedCodes);
    return codes.filter(c => !c.used).length;
}
