'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import styles from './companies.module.css';

interface Company {
    id: string;
    name: string;
    taxId: string;
    country: string;
    legalForm?: string;
    nrc?: string;
    address?: string;
    economicActivity?: string;
    shareCapital?: number;
}

export default function CompaniesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchCompanies();
        }
    }, [user, authLoading, router]);

    const fetchCompanies = async () => {
        try {
            const response = await fetch('/api/companies');
            if (response.ok) {
                const data = await response.json();
                setCompanies(data.companies || []);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Cargando empresas...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => router.push('/dashboard')} className={styles.backBtn}>
                    ← Volver
                </button>
                <div>
                    <h1>🏢 Mis Empresas</h1>
                    <p>Gestión de personas jurídicas - El Salvador</p>
                </div>
                <button onClick={() => setShowNewModal(true)} className={styles.newButton}>
                    + Nueva Empresa
                </button>
            </div>

            <div className={styles.companiesList}>
                {companies.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🏢</div>
                        <h3>No tienes empresas registradas</h3>
                        <p>Crea tu primera empresa para comenzar a usar el sistema</p>
                        <button onClick={() => setShowNewModal(true)} className={styles.createFirstBtn}>
                            Crear Primera Empresa
                        </button>
                    </div>
                ) : (
                    companies.map(company => (
                        <div key={company.id} className={styles.companyCard}>
                            <div className={styles.companyIcon}>🏢</div>
                            <div className={styles.companyInfo}>
                                <h3>{company.name}</h3>
                                <p className={styles.legalForm}>{company.legalForm || 'S.A.'}</p>
                                <div className={styles.companyDetails}>
                                    <span><strong>NIT:</strong> {company.taxId}</span>
                                    {company.nrc && <span><strong>NRC:</strong> {company.nrc}</span>}
                                    {company.economicActivity && (
                                        <span><strong>Actividad:</strong> {company.economicActivity}</span>
                                    )}
                                </div>
                            </div>
                            <button className={styles.selectBtn}>
                                Usar Empresa
                            </button>
                        </div>
                    ))
                )}
            </div>

            {showNewModal && (
                <NewCompanyModal
                    onClose={() => setShowNewModal(false)}
                    onSuccess={() => {
                        setShowNewModal(false);
                        fetchCompanies();
                    }}
                />
            )}
        </div>
    );
}

function NewCompanyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        legalForm: 'SA',
        name: '',
        nit: '',
        nrc: '',
        address: '',
        economicActivity: '',
        shareCapital: '',
        municipality: '',
        department: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const legalForms = [
        { value: 'SA', label: 'Sociedad Anónima (S.A.)' },
        { value: 'SRL', label: 'Sociedad de Responsabilidad Limitada (S. de R.L.)' },
        { value: 'EIRL', label: 'Empresa Individual de Responsabilidad Limitada (E.I.R.L.)' },
        { value: 'SC', label: 'Sociedad Colectiva' },
        { value: 'SCS', label: 'Sociedad en Comandita Simple' },
    ];

    const departments = [
        'San Salvador', 'La Libertad', 'Santa Ana', 'Sonsonate', 'San Miguel',
        'Usulután', 'La Paz', 'Chalatenango', 'Cuscatlán', 'Ahuachapán',
        'La Unión', 'Morazán', 'Cabañas', 'San Vicente'
    ];

    const economicActivities = [
        'Comercio al por mayor y menor',
        'Servicios profesionales',
        'Construcción',
        'Manufactura',
        'Agricultura',
        'Transporte',
        'Restaurantes y hoteles',
        'Servicios financieros',
        'Tecnología e informática',
    ];

    const validateNIT = (nit: string) => {
        const clean = nit.replace(/[^0-9]/g, '');
        return clean.length >= 13;
    };

    const validateNRC = (nrc: string) => {
        const clean = nrc.replace(/[^0-9]/g, '');
        return clean.length >= 6 && clean.length <= 8;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validaciones
        if (!validateNIT(formData.nit)) {
            setError('NIT inválido. Formato: XXXX-XXXXXX-XXX-X');
            return;
        }

        if (!validateNRC(formData.nrc)) {
            setError('NRC inválido. Debe contener 6-7 dígitos');
            return;
        }

        if (['SA', 'SRL'].includes(formData.legalForm) && !formData.shareCapital) {
            setError('El capital social es obligatorio para S.A. y S. de R.L.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    shareCapital: formData.shareCapital ? parseFloat(formData.shareCapital) : null,
                    country: 'SV',
                }),
            });

            const data = await response.json();

            if (response.ok) {
                onSuccess();
            } else {
                setError(data.error || 'Error al crear empresa');
            }
        } catch (err) {
            setError('Error al crear empresa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>🏢 Nueva Empresa</h2>
                    <button onClick={onClose} className={styles.closeBtn}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.formGroup}>
                        <label>Forma Jurídica *</label>
                        <select
                            value={formData.legalForm}
                            onChange={(e) => setFormData({ ...formData, legalForm: e.target.value })}
                            required
                        >
                            {legalForms.map(form => (
                                <option key={form.value} value={form.value}>{form.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Razón Social / Nombre Comercial *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Empresa Demo S.A. de C.V."
                            required
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>NIT (Número de Identificación Tributaria) *</label>
                            <input
                                type="text"
                                value={formData.nit}
                                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                                placeholder="0614-210188-101-2"
                                maxLength={17}
                                required
                            />
                            <small>Formato: XXXX-XXXXXX-XXX-X</small>
                        </div>

                        <div className={styles.formGroup}>
                            <label>NRC (Número de Registro de Contribuyente) *</label>
                            <input
                                type="text"
                                value={formData.nrc}
                                onChange={(e) => setFormData({ ...formData, nrc: e.target.value })}
                                placeholder="123456"
                                maxLength={7}
                                required
                            />
                            <small>6-7 dígitos</small>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Actividad Económica *</label>
                        <select
                            value={formData.economicActivity}
                            onChange={(e) => setFormData({ ...formData, economicActivity: e.target.value })}
                            required
                        >
                            <option value="">Seleccionar...</option>
                            {economicActivities.map(activity => (
                                <option key={activity} value={activity}>{activity}</option>
                            ))}
                        </select>
                    </div>

                    {['SA', 'SRL'].includes(formData.legalForm) && (
                        <div className={styles.formGroup}>
                            <label>Capital Social (USD) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.shareCapital}
                                onChange={(e) => setFormData({ ...formData, shareCapital: e.target.value })}
                                placeholder="2000.00"
                                required
                            />
                            <small>Mínimo recomendado: $2,000.00</small>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label>Dirección Completa *</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Colonia Escalón, Calle Principal #123, San Salvador"
                            rows={3}
                            required
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Departamento *</label>
                            <select
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Municipio *</label>
                            <input
                                type="text"
                                value={formData.municipality}
                                onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                                placeholder="Ej: San Salvador"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className={styles.error}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 4h2v5H7V4zm0 6h2v2H7v-2z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className={styles.submitBtn}>
                        {loading ? 'Creando empresa...' : 'Crear Empresa'}
                    </button>
                </form>
            </div>
        </div>
    );
}
