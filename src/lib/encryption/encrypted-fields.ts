import { encrypt, decrypt, maskSensitiveData } from './crypto';

/**
 * Modelo de datos encriptados para campos sensibles
 * Facilita el uso de encriptación con Prisma
 */

export class EncryptedField {
    private value: string;

    constructor(value: string) {
        this.value = value;
    }

    /**
     * Encripta el valor antes de guardarlo en la base de datos
     */
    public toDatabase(): string {
        return encrypt(this.value);
    }

    /**
     * Obtiene el valor plano (para uso en la aplicación)
     */
    public getValue(): string {
        return this.value;
    }

    /**
     * Crea una instancia desde datos encriptados de la base de datos
     */
    public static fromDatabase(encryptedValue: string): EncryptedField {
        const decryptedValue = decrypt(encryptedValue);
        return new EncryptedField(decryptedValue);
    }

    /**
     * Ofusca el valor para logging seguro
     */
    public toLogSafe(): string {
        return maskSensitiveData(this.value);
    }
}

/**
 * Interfaz para tipos comunes de datos sensibles
 */

export interface SensitiveData {
    /** Razón social / Nombre completo */
    fullName?: string;
    /** Número de identificación fiscal (RFC, Tax ID, etc.) */
    taxId?: string;
    /** Dirección física */
    address?: string;
    /** Número de teléfono */
    phone?: string;
    /** Información bancaria */
    bankAccountNumber?: string;
    /** Notas o comentarios sensibles */
    notes?: string;
}

/**
 * Encripta múltiples campos de un objeto
 */
export function encryptSensitiveData(data: SensitiveData): Record<string, string> {
    const encrypted: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
            encrypted[key] = encrypt(String(value));
        }
    }

    return encrypted;
}

/**
 * Desencripta múltiples campos de un objeto
 */
export function decryptSensitiveData<T extends SensitiveData>(
    encryptedData: Record<string, string>
): T {
    const decrypted: Record<string, string | null> = {};

    for (const [key, value] of Object.entries(encryptedData)) {
        if (value) {
            try {
                decrypted[key] = decrypt(value);
            } catch (error) {
                console.error(`Failed to decrypt field: ${key}`, error);
                decrypted[key] = null;
            }
        }
    }

    return decrypted as unknown as T;
}

/**
 * Ejemplo de uso con un modelo de Company
 */
export interface EncryptedCompanyData {
    legalName: string;
    taxId: string;
    address: string;
    phone: string;
    bankAccount: string;
}

/**
 * Prepara datos de empresa para almacenamiento seguro
 */
export function prepareCompanyForStorage(companyData: EncryptedCompanyData) {
    return {
        legalName: encrypt(companyData.legalName),
        taxId: encrypt(companyData.taxId),
        address: encrypt(companyData.address),
        phone: encrypt(companyData.phone),
        bankAccount: encrypt(companyData.bankAccount),
    };
}

/**
 * Recupera datos de empresa desde almacenamiento encriptado
 */
export function retrieveCompanyFromStorage(
    encryptedData: Record<string, string>
): EncryptedCompanyData {
    return {
        legalName: decrypt(encryptedData.legalName),
        taxId: decrypt(encryptedData.taxId),
        address: decrypt(encryptedData.address),
        phone: decrypt(encryptedData.phone),
        bankAccount: decrypt(encryptedData.bankAccount),
    };
}
