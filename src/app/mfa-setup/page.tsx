'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import styles from './mfa-setup.module.css';
import QRCode from 'qrcode';

export default function MFASetupPage() {
    const [loading, setLoading] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resetting, setResetting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setupMFA();
    }, []);

    const resetMFA = async () => {
        console.log('🔄 resetMFA llamado');

        if (!window.confirm('¿Resetear MFA? Esto eliminará la configuración existente.')) {
            return;
        }

        try {
            setResetting(true);
            setError('');

            const response = await fetch('/api/mfa/reset', { method: 'POST' });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al resetear MFA');
            }

            alert(`✅ ${data.message}`);
            window.location.reload();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMsg);
            alert('Error: ' + errorMsg);
        } finally {
            setResetting(false);
        }
    };

    const setupMFA = async () => {
        try {
            setLoading(true);
            setError('');

            const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });

            if (error) {
                if (error.message.includes('already exists')) {
                    setError('⚠️ Hay un factor MFA existente. Presiona "Resetear MFA" para empezar de nuevo.');
                } else {
                    throw error;
                }
                return;
            }

            if (data) {
                const qrCodeImage = await QRCode.toDataURL(data.totp.qr_code, {
                    errorCorrectionLevel: 'L',
                    margin: 1,
                    width: 256,
                });
                setQrCode(qrCodeImage);
                setSecret(data.totp.secret);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const factorId = (await supabase.auth.mfa.listFactors()).data?.totp?.[0]?.id;
            if (!factorId) throw new Error('No se encontró el factor MFA');

            const { error } = await supabase.auth.mfa.challengeAndVerify({
                factorId,
                code: verifyCode,
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => router.push('/dashboard'), 2000);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Código inválido';
            setError(errorMsg);
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>🔐 Configurar MFA</h1>
                    <p className={styles.subtitle}>Autenticación de Dos Factores</p>
                </div>

                {!success ? (
                    <>
                        <div className={styles.steps}>
                            {qrCode && (
                                <div className={styles.qrContainer}>
                                    <img src={qrCode} alt="QR Code" className={styles.qrCode} />
                                </div>
                            )}

                            {secret && (
                                <div className={styles.secretContainer}>
                                    <p>O ingresa manualmente:</p>
                                    <code className={styles.secret}>{secret}</code>
                                </div>
                            )}

                            <form onSubmit={handleVerify} className={styles.form}>
                                <input
                                    type="text"
                                    value={verifyCode}
                                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="123456"
                                    maxLength={6}
                                    className={styles.input}
                                    required
                                />

                                {error && (
                                    <div className={styles.error}>
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || verifyCode.length !== 6}
                                    className={styles.button}
                                >
                                    {loading ? 'Verificando...' : 'Activar MFA'}
                                </button>
                            </form>
                        </div>

                        <div className={styles.footer}>
                            <button
                                onClick={resetMFA}
                                disabled={resetting}
                                className={styles.resetButton}
                            >
                                {resetting ? 'Reseteando...' : '🔄 Resetear MFA'}
                            </button>

                            <button
                                onClick={() => router.push('/dashboard')}
                                className={styles.skipButton}
                            >
                                Configurar después
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.successContainer}>
                        <h2>✅ ¡MFA Activado!</h2>
                        <p>Redirigiendo al dashboard...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
