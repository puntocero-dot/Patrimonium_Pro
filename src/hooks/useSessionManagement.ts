'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionManager, detectConcurrentSessions } from '@/lib/auth/session-manager';

export function useSessionManagement(options?: {
    inactivityTimeoutMs?: number;
    enableConcurrentDetection?: boolean;
}) {
    const router = useRouter();
    const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);

    useEffect(() => {
        const manager = new SessionManager(options?.inactivityTimeoutMs);
        setSessionManager(manager);

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
        sessionManager,
    };
}
