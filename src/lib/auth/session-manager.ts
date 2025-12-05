import { supabase } from '@/lib/supabase/client';

/**
 * Gestión avanzada de sesiones con seguridad reforzada
 */

const SESSION_STORAGE_KEY = 'conta2go_session_metadata';
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos por defecto
const SESSION_CHECK_INTERVAL = 60 * 1000; // Revisar cada minuto

export interface SessionMetadata {
    userId: string;
    sessionId: string;
    deviceId: string;
    lastActivity: number;
    createdAt: number;
    ipAddress?: string;
}

/**
 * Genera un ID único para el dispositivo
 */
function getDeviceId(): string {
    let deviceId = localStorage.getItem('conta2go_device_id');

    if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('conta2go_device_id', deviceId);
    }

    return deviceId;
}

/**
 * Obtiene el metadata de la sesión actual
 */
export function getSessionMetadata(): SessionMetadata | null {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

/**
 * Guarda metadata de la sesión
 */
export function setSessionMetadata(metadata: SessionMetadata): void {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(metadata));
}

/**
 * Actualiza el timestamp de última actividad
 */
export function updateLastActivity(): void {
    const metadata = getSessionMetadata();
    if (metadata) {
        metadata.lastActivity = Date.now();
        setSessionMetadata(metadata);
    }
}

/**
 * Limpia metadata de sesión
 */
export function clearSessionMetadata(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Verifica si la sesión ha expirado por inactividad
 */
export function isSessionExpired(timeoutMs: number = INACTIVITY_TIMEOUT_MS): boolean {
    const metadata = getSessionMetadata();
    if (!metadata) return true;

    const inactiveTime = Date.now() - metadata.lastActivity;
    return inactiveTime > timeoutMs;
}

/**
 * Invalida todas las sesiones del usuario
 * Útil al cambiar contraseña
 */
export async function invalidateAllSessions(): Promise<void> {
    try {
        // Supabase invalida automáticamente todas las sesiones al cambiar contraseña
        await supabase.auth.signOut({ scope: 'global' });
        clearSessionMetadata();
    } catch (error) {
        console.error('Error invalidating sessions:', error);
        throw error;
    }
}

/**
 * Hook para gestión automática de sesiones
 * Debe llamarse en el componente raíz
 */
export class SessionManager {
    private checkInterval: NodeJS.Timeout | null = null;
    private activityListeners: Array<() => void> = [];
    private onSessionExpired?: () => void;
    private inactivityTimeout: number;

    constructor(inactivityTimeoutMs: number = INACTIVITY_TIMEOUT_MS) {
        this.inactivityTimeout = inactivityTimeoutMs;
    }

    /**
     * Inicia el monitoreo de sesión
     */
    public start(onSessionExpired?: () => void): void {
        this.onSessionExpired = onSessionExpired;

        // Inicializar metadata de sesión
        this.initializeSession();

        // Registrar listeners de actividad
        this.registerActivityListeners();

        // Iniciar verificación periódica
        this.startPeriodicCheck();
    }

    /**
     * Detiene el monitoreo de sesión
     */
    public stop(): void {
        this.removeActivityListeners();
        this.stopPeriodicCheck();
    }

    /**
     * Inicializa la sesión actual
     */
    private async initializeSession(): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            const metadata: SessionMetadata = {
                userId: session.user.id,
                sessionId: session.access_token.substring(0, 20),
                deviceId: getDeviceId(),
                lastActivity: Date.now(),
                createdAt: Date.now(),
            };

            setSessionMetadata(metadata);
        }
    }

    /**
     * Registra eventos de actividad del usuario
     */
    private registerActivityListeners(): void {
        const updateActivity = () => updateLastActivity();

        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click',
        ];

        events.forEach(event => {
            window.addEventListener(event, updateActivity, { passive: true });
        });

        this.activityListeners = events.map(event => {
            return () => window.removeEventListener(event, updateActivity);
        });
    }

    /**
     * Remueve listeners de actividad
     */
    private removeActivityListeners(): void {
        this.activityListeners.forEach(remove => remove());
        this.activityListeners = [];
    }

    /**
     * Inicia verificación periódica de inactividad
     */
    private startPeriodicCheck(): void {
        this.checkInterval = setInterval(() => {
            if (isSessionExpired(this.inactivityTimeout)) {
                this.handleSessionExpired();
            }
        }, SESSION_CHECK_INTERVAL);
    }

    /**
     * Detiene verificación periódica
     */
    private stopPeriodicCheck(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Maneja expiración de sesión
     */
    private async handleSessionExpired(): Promise<void> {
        this.stop();
        await supabase.auth.signOut();
        clearSessionMetadata();

        if (this.onSessionExpired) {
            this.onSessionExpired();
        }
    }
}

/**
 * Detecta sesiones concurrentes
 * Verifica si hay otra sesión activa en otro tab/ventana
 */
export function detectConcurrentSessions(): void {
    // Usar BroadcastChannel para comunicación entre tabs
    const channel = new BroadcastChannel('conta2go_session_channel');

    // Enviar ping al iniciar
    channel.postMessage({ type: 'SESSION_PING', deviceId: getDeviceId() });

    // Escuchar respuestas
    channel.onmessage = (event) => {
        if (event.data.type === 'SESSION_PING') {
            const currentDeviceId = getDeviceId();

            // Si otro tab responde con diferente deviceId, hay sesión concurrente
            if (event.data.deviceId !== currentDeviceId) {
                console.warn('Concurrent session detected from another tab/window');

                // Opcional: notificar al usuario
                // Opcional: cerrar una de las sesiones
            }

            // Responder al ping
            channel.postMessage({
                type: 'SESSION_PONG',
                deviceId: currentDeviceId
            });
        }
    };
}

/**
 * Configuración de sesión al cambiar contraseña
 */
export async function handlePasswordChange(): Promise<void> {
    // Invalidar todas las sesiones excepto la actual
    await invalidateAllSessions();

    // Opcional: enviar notificación al usuario
    console.info('Password changed. All sessions have been invalidated.');
}
