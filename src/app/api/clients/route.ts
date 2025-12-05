import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase/client';

// Add Client model to Prisma schema first
export async function GET(request: NextRequest) {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Get user's company (simplified - in production use current company)
        const userRecord = await prisma.user.findUnique({
            where: { id: user.id },
            include: { companies: true },
        });

        if (!userRecord || userRecord.companies.length === 0) {
            return NextResponse.json({ clients: [] });
        }

        const companyId = userRecord.companies[0].id;

        // For now, return mock data until we add Client model
        const mockClients = [
            {
                id: '1',
                name: 'Juan Pérez',
                email: 'juan@example.com',
                phone: '+503 7123-4567',
                nit: '0614-210188-101-2',
                dui: '01234567-8',
                address: 'San Salvador',
                type: 'INDIVIDUAL',
                balance: 1500.00,
                companyId,
            }
        ];

        return NextResponse.json({ clients: mockClients });
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json(
            { error: 'Error al obtener clientes' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, phone, nit, dui, address, type } = body;

        // Validations
        if (!name || !type) {
            return NextResponse.json(
                { error: 'Nombre y tipo son requeridos' },
                { status: 400 }
            );
        }

        // Get user's company
        const userRecord = await prisma.user.findUnique({
            where: { id: user.id },
            include: { companies: true },
        });

        if (!userRecord || userRecord.companies.length === 0) {
            return NextResponse.json(
                { error: 'Usuario sin empresa asignada' },
                { status: 400 }
            );
        }

        const companyId = userRecord.companies[0].id;

        // TODO: Create client when model is added
        // For now, return success
        const client = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            nit,
            dui,
            address,
            type,
            balance: 0,
            companyId,
        };

        return NextResponse.json({ client }, { status: 201 });
    } catch (error) {
        console.error('Error creating client:', error);
        return NextResponse.json(
            { error: 'Error al crear cliente' },
            { status: 500 }
        );
    }
}
