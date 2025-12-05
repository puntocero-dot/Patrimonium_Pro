'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import styles from './transactions.module.css';

interface Transaction {
    id: string;
    type: 'INGRESO' | 'EGRESO';
    amount: number;
    description: string;
    date: string;
    category: {
        name: string;
        icon: string;
        color: string;
    };
}

export default function TransactionsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'INGRESO' | 'EGRESO'>('ALL');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchTransactions();
        }
    }, [user, authLoading, router]);

    const fetchTransactions = async () => {
        try {
            const response = await fetch('/api/transactions');
            if (response.ok) {
                const data = await response.json();
                setTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(t =>
        filter === 'ALL' || t.type === filter
    );

    const totalIngresos = transactions
        .filter(t => t.type === 'INGRESO')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalEgresos = transactions
        .filter(t => t.type === 'EGRESO')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIngresos - totalEgresos;

    if (authLoading || loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Cargando transacciones...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>💰 Transacciones</h1>
                    <p>Gestiona tus ingresos y egresos</p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className={styles.newButton}
                >
                    + Nueva Transacción
                </button>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.income}`}>
                    <div className={styles.statIcon}>📈</div>
                    <div className={styles.statContent}>
                        <p className={styles.statLabel}>Ingresos</p>
                        <h3 className={styles.statValue}>${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>

                <div className={`${styles.statCard} ${styles.expense}`}>
                    <div className={styles.statIcon}>📉</div>
                    <div className={styles.statContent}>
                        <p className={styles.statLabel}>Egresos</p>
                        <h3 className={styles.statValue}>${totalEgresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>

                <div className={`${styles.statCard} ${balance >= 0 ? styles.positive : styles.negative}`}>
                    <div className={styles.statIcon}>{balance >= 0 ? '✅' : '⚠️'}</div>
                    <div className={styles.statContent}>
                        <p className={styles.statLabel}>Balance</p>
                        <h3 className={styles.statValue}>${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <button
                    className={filter === 'ALL' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('ALL')}
                >
                    Todas
                </button>
                <button
                    className={filter === 'INGRESO' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('INGRESO')}
                >
                    Ingresos
                </button>
                <button
                    className={filter === 'EGRESO' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('EGRESO')}
                >
                    Egresos
                </button>
            </div>

            {/* Transactions List */}
            <div className={styles.transactionsList}>
                {filteredTransactions.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>📭 No hay transacciones aún</p>
                        <button onClick={() => setShowNewModal(true)}>
                            Crear primera transacción
                        </button>
                    </div>
                ) : (
                    filteredTransactions.map(transaction => (
                        <div key={transaction.id} className={styles.transactionCard}>
                            <div className={styles.transactionIcon} style={{ background: transaction.category.color }}>
                                {transaction.category.icon}
                            </div>
                            <div className={styles.transactionInfo}>
                                <h4>{transaction.description}</h4>
                                <p className={styles.transactionCategory}>{transaction.category.name}</p>
                                <p className={styles.transactionDate}>
                                    {new Date(transaction.date).toLocaleDateString('es-MX')}
                                </p>
                            </div>
                            <div className={`${styles.transactionAmount} ${transaction.type === 'INGRESO' ? styles.amountIncome : styles.amountExpense
                                }`}>
                                {transaction.type === 'INGRESO' ? '+' : '-'}
                                ${transaction.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* New Transaction Modal */}
            {showNewModal && (
                <NewTransactionModal
                    onClose={() => setShowNewModal(false)}
                    onSuccess={() => {
                        setShowNewModal(false);
                        fetchTransactions();
                    }}
                />
            )}
        </div>
    );
}

function NewTransactionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        type: 'INGRESO' as 'INGRESO' | 'EGRESO',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                }),
            });

            if (response.ok) {
                onSuccess();
            } else {
                alert('Error al crear transacción');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al crear transacción');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Nueva Transacción</h2>
                    <button onClick={onClose} className={styles.closeBtn}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.formGroup}>
                        <label>Tipo</label>
                        <div className={styles.typeButtons}>
                            <button
                                type="button"
                                className={formData.type === 'INGRESO' ? styles.typeActive : ''}
                                onClick={() => setFormData({ ...formData, type: 'INGRESO' })}
                            >
                                📈 Ingreso
                            </button>
                            <button
                                type="button"
                                className={formData.type === 'EGRESO' ? styles.typeActive : ''}
                                onClick={() => setFormData({ ...formData, type: 'EGRESO' })}
                            >
                                📉 Egreso
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Monto</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Descripción</label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ej: Venta de producto"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Fecha</label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <button type="submit" disabled={loading} className={styles.submitBtn}>
                        {loading ? 'Guardando...' : 'Guardar Transacción'}
                    </button>
                </form>
            </div>
        </div>
    );
}
