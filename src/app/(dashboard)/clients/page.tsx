'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import styles from './clients.module.css';

interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    nit?: string;
    dui?: string;
    address?: string;
    type: 'INDIVIDUAL' | 'COMPANY';
    balance: number;
}

export default function ClientsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'INDIVIDUAL' | 'COMPANY'>('ALL');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchClients();
        }
    }, [user, authLoading, router]);

    const fetchClients = async () => {
        try {
            const response = await fetch('/api/clients');
            if (response.ok) {
                const data = await response.json();
                setClients(data.clients || []);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(c =>
        filter === 'ALL' || c.type === filter
    );

    const totalBalance = clients.reduce((sum, c) => sum + c.balance, 0);

    if (authLoading || loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Cargando clientes...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>👥 Clientes</h1>
                    <p>Gestión de clientes y proveedores</p>
                </div>
                <button onClick={() => setShowNewModal(true)} className={styles.newButton}>
                    + Nuevo Cliente
                </button>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>👥</div>
                    <div>
                        <p>Total Clientes</p>
                        <h3>{clients.length}</h3>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>🏢</div>
                    <div>
                        <p>Empresas</p>
                        <h3>{clients.filter(c => c.type === 'COMPANY').length}</h3>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>💰</div>
                    <div>
                        <p>Saldo Pendiente</p>
                        <h3>${totalBalance.toLocaleString('es-MX')}</h3>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <button
                    className={filter === 'ALL' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('ALL')}
                >
                    Todos
                </button>
                <button
                    className={filter === 'INDIVIDUAL' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('INDIVIDUAL')}
                >
                    Personas
                </button>
                <button
                    className={filter === 'COMPANY' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('COMPANY')}
                >
                    Empresas
                </button>
            </div>

            {/* Clients List */}
            <div className={styles.clientsList}>
                {filteredClients.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>👥</div>
                        <h3>No hay clientes registrados</h3>
                        <p>Crea tu primer cliente para comenzar</p>
                        <button onClick={() => setShowNewModal(true)}>
                            Crear Primer Cliente
                        </button>
                    </div>
                ) : (
                    filteredClients.map(client => (
                        <div key={client.id} className={styles.clientCard}>
                            <div className={styles.clientAvatar}>
                                {client.type === 'COMPANY' ? '🏢' : '👤'}
                            </div>
                            <div className={styles.clientInfo}>
                                <h4>{client.name}</h4>
                                <div className={styles.clientDetails}>
                                    {client.email && <span>✉️ {client.email}</span>}
                                    {client.phone && <span>📞 {client.phone}</span>}
                                    {client.nit && <span>🏛️ NIT: {client.nit}</span>}
                                </div>
                            </div>
                            <div className={styles.clientBalance}>
                                <p>Saldo</p>
                                <h4 className={client.balance > 0 ? styles.positive : ''}>
                                    ${client.balance.toLocaleString('es-MX')}
                                </h4>
                            </div>
                            <button className={styles.viewBtn}>
                                Ver Detalles
                            </button>
                        </div>
                    ))
                )}
            </div>

            {showNewModal && (
                <NewClientModal
                    onClose={() => setShowNewModal(false)}
                    onSuccess={() => {
                        setShowNewModal(false);
                        fetchClients();
                    }}
                />
            )}
        </div>
    );
}

function NewClientModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'COMPANY',
        name: '',
        email: '',
        phone: '',
        nit: '',
        dui: '',
        address: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                onSuccess();
            } else {
                alert('Error al crear cliente');
            }
        } catch (error) {
            alert('Error al crear cliente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Nuevo Cliente</h2>
                    <button onClick={onClose} className={styles.closeBtn}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.typeButtons}>
                        <button
                            type="button"
                            className={formData.type === 'INDIVIDUAL' ? styles.typeActive : ''}
                            onClick={() => setFormData({ ...formData, type: 'INDIVIDUAL' })}
                        >
                            👤 Persona
                        </button>
                        <button
                            type="button"
                            className={formData.type === 'COMPANY' ? styles.typeActive : ''}
                            onClick={() => setFormData({ ...formData, type: 'COMPANY' })}
                        >
                            🏢 Empresa
                        </button>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Nombre Completo / Razón Social *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Juan Pérez / Empresa S.A."
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="cliente@example.com"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+503 7123-4567"
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        {formData.type === 'INDIVIDUAL' ? (
                            <div className={styles.formGroup}>
                                <label>DUI</label>
                                <input
                                    type="text"
                                    value={formData.dui}
                                    onChange={(e) => setFormData({ ...formData, dui: e.target.value })}
                                    placeholder="01234567-8"
                                    maxLength={10}
                                />
                            </div>
                        ) : (
                            <div className={styles.formGroup}>
                                <label>NIT</label>
                                <input
                                    type="text"
                                    value={formData.nit}
                                    onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                                    placeholder="0614-210188-101-2"
                                />
                            </div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Dirección</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Dirección completa"
                            rows={3}
                        />
                    </div>

                    <button type="submit" disabled={loading} className={styles.submitBtn}>
                        {loading ? 'Guardando...' : 'Guardar Cliente'}
                    </button>
                </form>
            </div>
        </div>
    );
}
