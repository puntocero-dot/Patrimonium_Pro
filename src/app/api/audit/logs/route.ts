import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs, AuditAction, AuditResult } from '@/lib/audit/audit-service';
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

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Obtener parámetros de query
        const searchParams = request.nextUrl.searchParams;
        const queryUserId = searchParams.get('userId') || undefined;
        const queryAction = searchParams.get('action') as AuditAction | undefined;
        const queryResource = searchParams.get('resource') || undefined;
        const queryResult = searchParams.get('result') as AuditResult | undefined;
        const queryLimit = parseInt(searchParams.get('limit') || '50');
        const queryOffset = parseInt(searchParams.get('offset') || '0');

        const queryStartDate = searchParams.get('startDate')
            ? new Date(searchParams.get('startDate')!)
            : undefined;
        const queryEndDate = searchParams.get('endDate')
            ? new Date(searchParams.get('endDate')!)
            : undefined;

        // Verificar permisos (solo SUPER_ADMIN puede ver todos los logs)
        const userRole = user.user_metadata?.role;
        const logFilters = {
            userId: userRole !== 'SUPER_ADMIN' ? user.id : queryUserId,
            action: queryAction,
            resource: queryResource,
            result: queryResult,
            startDate: queryStartDate,
            endDate: queryEndDate,
            limit: queryLimit,
            offset: queryOffset,
        };

        const logs = await getAuditLogs(logFilters);

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
