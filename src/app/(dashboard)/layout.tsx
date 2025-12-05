'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import styles from './layout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, role } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const menuItems = [
        { path: '/dashboard', icon: '🏠', label: 'Dashboard', roles: ['all'] },
        { path: '/companies', icon: '🏢', label: 'Empresas', roles: ['all'] },
        { path: '/clients', icon: '👥', label: 'Clientes', roles: ['all'] },
        { path: '/transactions', icon: '💰', label: 'Transacciones', roles: ['all'] },
        { path: '/reports', icon: '📊', label: 'Reportes', roles: ['all'] },
        { path: '/security-dashboard', icon: '🔐', label: 'Seguridad', roles: ['SUPER_ADMIN'] },
    ];

    const filteredMenu = menuItems.filter(item =>
        item.roles.includes('all') || item.roles.includes(role || '')
    );

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ''}`}>
                <div className={styles.sidebarHeader}>
                    <h1 className={styles.logo}>
                        Conta<span className={styles.logoAccent}>2</span>Go
                    </h1>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={styles.toggleBtn}
                    >
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <nav className={styles.nav}>
                    {filteredMenu.map(item => (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {sidebarOpen && <span className={styles.navLabel}>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userCard}>
                        <div className={styles.avatar}>
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        {sidebarOpen && (
                            <div className={styles.userInfo}>
                                <p className={styles.userName}>{user?.email}</p>
                                <span className={styles.userRole}>{role}</span>
                            </div>
                        )}
                    </div>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        🚪 {sidebarOpen && 'Salir'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
