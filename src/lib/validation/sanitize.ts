import { z } from 'zod';
import DOMPurify from 'dompurify';

/**
 * Schemas de validación con Zod para diferentes entidades
 */

// Usuario
export const userSchema = z.object({
    email: z.string().email('Email inválido').toLowerCase().trim(),
    password: z.string().min(12, 'La contraseña debe tener al menos 12 caracteres'),
    role: z.enum(['SUPER_ADMIN', 'CONTADOR', 'CLIENTE', 'AUDITOR']).optional(),
});

// Empresa
export const companySchema = z.object({
    legalName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
    taxId: z.string().regex(/^[A-Z0-9-]+$/, 'Tax ID inválido').trim().toUpperCase(),
    address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').max(500),
    phone: z.string().regex(/^\+?[0-9\s()-]+$/, 'Teléfono inválido').trim(),
    email: z.string().email('Email inválido').toLowerCase().trim().optional(),
    website: z.string().url('URL inválida').optional().or(z.literal('')),
});

// Transacción financiera
export const transactionSchema = z.object({
    amount: z.number().positive('El monto debe ser positivo'),
    description: z.string().min(3, 'La descripción debe tener al menos 3 caracteres').max(500),
    type: z.enum(['INCOME', 'EXPENSE']),
    category: z.string().min(2).max(100),
    date: z.date().or(z.string().datetime()),
    invoiceNumber: z.string().max(100).optional(),
    notes: z.string().max(1000).optional(),
});

/**
 * Sanitiza HTML para prevenir XSS
 */
export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: [],
    });
}

/**
 * Sanitiza texto plano (remueve HTML completamente)
 */
export function sanitizeText(text: string): string {
    return DOMPurify.sanitize(text, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
    });
}

/**
 * Sanitiza y valida un email
 */
export function sanitizeEmail(email: string): string {
    const sanitized = sanitizeText(email).toLowerCase().trim();
    return sanitized;
}

/**
 * Sanitiza números de teléfono
 */
export function sanitizePhone(phone: string): string {
    // Remover todo excepto números, +, (), - y espacios
    return phone.replace(/[^0-9+\-\s()]/g, '').trim();
}

/**
 * Sanitiza Tax ID / RFC
 */
export function sanitizeTaxId(taxId: string): string {
    // Solo alfanuméricos y guiones
    return taxId.replace(/[^A-Za-z0-9-]/g, '').toUpperCase().trim();
}

/**
 * Validación y sanitización genérica
 */
export function validateAndSanitize<T>(
    data: unknown,
    schema: z.ZodSchema<T>
): { success: boolean; data?: T; errors?: z.ZodError } {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, errors: error };
        }
        throw error;
    }
}

/**
 * Remove caracteres peligrosos de nombres de archivos
 */
export function sanitizeFilename(filename: string): string {
    // Remover path traversal y caracteres especiales
    return filename
        .replace(/\.\./g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 255);
}

/**
 * Validar formato y tamaño de archivos subidos
 */
export function validateFileUpload(file: File, options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
}): { valid: boolean; error?: string } {
    const maxSize = (options.maxSizeMB || 10) * 1024 * 1024; // Default 10MB

    // Verificar tamaño
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `El archivo excede el tamaño máximo de ${options.maxSizeMB || 10}MB`,
        };
    }

    // Verificar tipo
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Tipo de archivo no permitido. Permitidos: ${options.allowedTypes.join(', ')}`,
        };
    }

    return { valid: true };
}

/**
 * Sanitiza y valida URL
 */
export function sanitizeUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        // Solo permitir http y https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }
        return parsed.href;
    } catch {
        return null;
    }
}

/**
 * Prevenir SQL injection básico (aunque Prisma ya protege)
 */
export function sanitizeSqlInput(input: string): string {
    return input
        .replace(/['"\\;]/g, '')
        .trim();
}
