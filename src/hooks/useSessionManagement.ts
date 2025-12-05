'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SessionManager, detectConcurrentSessions } from '@/lib/auth/session-manager';

export function useSessionManagement(options?: {
    inactivityTimeoutMs?: number;
    enableConcurrentDetection?: boolean;
}) {
    const router = useRouter();
    const sessionManagerRef = useRef<SessionManager | null>(null);

    useEffect(() => {
        const manager = new SessionManager(options?.inactivityTimeoutMs);
        sessionManagerRef.current = manager;

        const handleSessionExpired = () => {
            router.push('/login?reason=session_expired');
        };

        manager.start(handleSessionExpired);

        if (options?.enableConcurrentDetection !== false) {
            detectConcurrentSessions();
        }

        return () => {
            manager.stop();
        };
    }, [router, options?.inactivityTimeoutMs, options?.enableConcurrentDetection]);

    return {
        sessionManager: sessionManagerRef.current,
    };
}
