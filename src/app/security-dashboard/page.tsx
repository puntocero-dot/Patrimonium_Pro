'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import styles from './security-dashboard.module.css';

interface AuditStats {
    totalLogs: number;
    failedActions: number;
    suspiciousActivity: number;
    recentLogins: number;
}

interface AuditLog {
    id: string;
    timestamp: string;
    action: string;
    resource: string;
    result: string;
    ipAddress: string;
    user?: {
        email: string;
        role: string;
    };
}

export default function SecurityDashboard() {
    const { user, role, loading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && (!user || role !== 'SUPER_ADMIN')) {
            router.push('/dashboard');
        }
    }, [user, role, loading, router]);

    useEffect(() => {
        if (user && role === 'SUPER_ADMIN') {
            fetchDashboardData();
        }
    }, [user, role]);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, logsRes] = await Promise.all([
                fetch('/api/audit/stats'),
                fetch('/api/audit/logs?limit=10'),
            ]);

            if (statsRes.ok && logsRes.ok) {
                const statsData = await statsRes.json();
                const logsData = await logsRes.json();

                setStats(statsData);
                setRecentLogs(logsData.logs);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    if (loading || loadingData) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Cargando Security Dashboard...</p>
            </div>
        );
    }

    if (!user || role !== 'SUPER_ADMIN') {
        return null;
    }

    const getResultColor = (result: string) => {
        switch (result) {
            case 'success':
                return styles.success;
            case 'failure':
                return styles.failure;
            case 'blocked':
                return styles.blocked;
            case 'warning':
                return styles.warning;
            default:
                return '';
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>🛡️ Security Dashboard</h1>
                <p>Monitoreo y auditoría del sistema</p>
            </header>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statContent}>
                        <h3>Total de Logs</h3>
                        <p className={styles.statValue}>{stats?.totalLogs || 0}</p>
                        <span className={styles.statLabel}>Registros totales</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>🔐</div>
                    <div className={styles.statContent}>
                        <h3>Logins Recientes</h3>
                        <p className={styles.statValue}>{stats?.recentLogins || 0}</p>
                        <span className={styles.statLabel}>Últimas 24 horas</span>
                    </div>
                </div>

                <div className={`${styles.statCard} ${styles.warningCard}`}>
                    <div className={styles.statIcon}>⚠️</div>
                    <div className={styles.statContent}>
                        <h3>Acciones Fallidas</h3>
                        <p className={styles.statValue}>{stats?.failedActions || 0}</p>
                        <span className={styles.statLabel}>Requiere atención</span>
                    </div>
                </div>

                <div className={`${styles.statCard} ${styles.dangerCard}`}>
                    <div className={styles.statIcon}>🚨</div>
                    <div className={styles.statContent}>
                        <h3>Actividad Sospechosa</h3>
                        <p className={styles.statValue}>{stats?.suspiciousActivity || 0}</p>
                        <span className={styles.statLabel}>Alertas de seguridad</span>
                    </div>
                </div>
            </div>

            {/* Recent Logs */}
            <div className={styles.logsSection}>
                <div className={styles.sectionHeader}>
                    <h2>📋 Actividad Reciente</h2>
                    <button onClick={() => router.push('/security/audit-logs')} className={styles.viewAllBtn}>
                        Ver todos los logs →
                    </button>
                </div>

                <div className={styles.logsTable}>
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Usuario</th>
                                <th>Acción</th>
                                <th>Recurso</th>
                                <th>IP Address</th>
                                <th>Resultado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentLogs.map((log) => (
                                <tr key={log.id}>
                                    <td>{new Date(log.timestamp).toLocaleString('es-MX')}</td>
                                    <td>
                                        <div className={styles.userCell}>
                                            <span className={styles.email}>{log.user?.email || 'Sistema'}</span>
                                            {log.user?.role && (
                                                <span className={styles.role}>{log.user.role}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td><code>{log.action}</code></td>
                                    <td>{log.resource}</td>
                                    <td><code>{log.ipAddress}</code></td>
                                    <td>
                                        <span className={`${styles.badge} ${getResultColor(log.result)}`}>
                                            {log.result}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {recentLogs.length === 0 && (
                        <div className={styles.emptyState}>
                            <p>No hay logs recientes</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.actionsSection}>
                <h2>⚡ Acciones Rápidas</h2>
                <div className={styles.actionsGrid}>
                    <button className={styles.actionBtn} onClick={() => router.push('/security/audit-logs')}>
                        📜 Ver Audit Logs Completos
                    </button>
                    <button className={styles.actionBtn} onClick={() => router.push('/security/users')}>
                        👥 Gestionar Usuarios
                    </button>
                    <button className={styles.actionBtn} onClick={() => router.push('/security/alerts')}>
                        🔔 Configurar Alertas
                    </button>
                    <button className={styles.actionBtn} onClick={fetchDashboardData}>
                        🔄 Refrescar Datos
                    </button>
                </div>
            </div>
        </div>
    );
}
