import { NextRequest, NextResponse } from 'next/server';
import { getAuditStats } from '@/lib/audit/audit-service';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
    try {
        // Verificar autenticación
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Obtener el usuario actual
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verificar que sea SUPER_ADMIN
        const userRole = user.user_metadata?.role;
        if (userRole !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        // Obtener estadísticas
        const stats = await getAuditStats();

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
