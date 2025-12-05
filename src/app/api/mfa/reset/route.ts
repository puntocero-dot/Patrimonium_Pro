import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
    try {
        // Obtener el usuario actual
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Listar todos los factores MFA
        const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();

        if (listError) {
            return NextResponse.json(
                { error: listError.message },
                { status: 500 }
            );
        }

        // Eliminar todos los factores encontrados
        const deletedFactors = [];
        if (factors?.totp && factors.totp.length > 0) {
            for (const factor of factors.totp) {
                const { error: unenrollError } = await supabase.auth.mfa.unenroll({
                    factorId: factor.id,
                });

                if (!unenrollError) {
                    deletedFactors.push(factor.id);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `${deletedFactors.length} factor(es) MFA eliminado(s)`,
            deletedFactors,
        });
    } catch (error: any) {
        console.error('Error resetting MFA:', error);
        return NextResponse.json(
            { error: error.message || 'Error al resetear MFA' },
            { status: 500 }
        );
    }
}
