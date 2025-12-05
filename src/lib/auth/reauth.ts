import { supabase } from '../supabase/client';

/**
 * Sistema de re-autenticación para acciones sensibles
 * Requiere que el usuario confirme su contraseña antes de realizar acciones críticas
 */

const REAUTH_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos
const REAUTH_STORAGE_KEY = 'conta2go_last_reauth';

/**
 * Acciones que requieren re-autenticación
 */
export enum SensitiveAction {
    CHANGE_PASSWORD = 'change_password',
    CHANGE_EMAIL = 'change_email',
    DELETE_ACCOUNT = 'delete_account',
    CHANGE_MFA = 'change_mfa',
    EXPORT_DATA = 'export_data',
    CHANGE_BANK_INFO = 'change_bank_info',
    DELETE_COMPANY = 'delete_company',
    TRANSFER_OWNERSHIP = 'transfer_ownership',
}

/**
 * Guarda el timestamp de la última re-autenticación
 */
function setLastReauthTime(): void {
    localStorage.setItem(REAUTH_STORAGE_KEY, Date.now().toString());
}

/**
 * Obtiene el timestamp de la última re-autenticación
 */
function getLastReauthTime(): number | null {
    const stored = localStorage.getItem(REAUTH_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
}

/**
 * Limpia el timestamp de re-autenticación
 */
function clearReauthTime(): void {
    localStorage.removeItem(REAUTH_STORAGE_KEY);
}

/**
 * Verifica si se requiere re-autenticación
 */
export function requiresReauth(
    action: SensitiveAction,
    timeoutMs: number = REAUTH_TIMEOUT_MS
): boolean {
    const lastReauth = getLastReauthTime();

    if (!lastReauth) {
        return true;
    }

    const elapsed = Date.now() - lastReauth;
    return elapsed > timeoutMs;
}

/**
 * Re-autentica al usuario con su contraseña
 */
export async function reauthenticateUser(
    email: string,
    password: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Verificar credenciales con Supabase
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return {
                success: false,
                error: 'Credenciales incorrectas',
            };
        }

        // Guardar timestamp de re-autenticación exitosa
        setLastReauthTime();

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: 'Error al verificar credenciales',
        };
    }
}

/**
 * Valida que el usuario esté re-autenticado antes de una acción sensible
 */
export async function validateSensitiveAction(
    action: SensitiveAction,
    email: string,
    password: string
): Promise<{ allowed: boolean; error?: string }> {
    // Verificar si necesita re-auth
    if (requiresReauth(action)) {
        // Re-autenticar
        const result = await reauthenticateUser(email, password);

        if (!result.success) {
            return {
                allowed: false,
                error: result.error,
            };
        }
    }

    return { allowed: true };
}

/**
 * Invalida la re-autenticación (por ejemplo, al cerrar sesión)
 */
export function invalidateReauth(): void {
    clearReauthTime();
}

/**
 * Hook React para manejar re-autenticación
 */
export function useReauth() {
    const checkReauth = (action: SensitiveAction) => {
        return requiresReauth(action);
    };

    const performReauth = async (email: string, password: string) => {
        return await reauthenticateUser(email, password);
    };

    return {
        checkReauth,
        performReauth,
        invalidateReauth,
    };
}
