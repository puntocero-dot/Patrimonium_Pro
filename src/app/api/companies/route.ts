import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/encryption/crypto';
import { TransactionType } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        // Obtener userId del header de autenticación
        const authHeader = request.headers.get('authorization');

        // Por ahora retornar array vacío si no hay empresas
        // TODO: Implementar auth correctamente
        const companies: any[] = [];

        return NextResponse.json({ companies });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Error al obtener empresas' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { legalForm, name, nit, nrc, address, economicActivity, shareCapital, municipality, department, country } = body;

        // Validación simple del NIT (acepta cualquier formato con 13+ dígitos)
        const nitClean = nit.replace(/[^0-9]/g, '');
        if (nitClean.length < 13) {
            return NextResponse.json({ error: 'NIT debe tener al menos 13 dígitos' }, { status: 400 });
        }

        // Por simplicidad, crear sin autenticación estricta
        // En producción DEBES implementar auth
        const encryptedTaxId = encrypt(nit);

        const company = await prisma.company.create({
            data: {
                name,
                taxId: encryptedTaxId,
                country: country || 'SV',
                metadata: {
                    legalForm, nrc, address, economicActivity, shareCapital, municipality, department, nit
                }
            }
        });

        // Crear categorías por defecto
        const categories = [
            { name: 'Ingresos', type: 'INGRESO' as TransactionType, icon: '💰', color: '#10b981' },
            { name: 'Gastos', type: 'EGRESO' as TransactionType, icon: '💸', color: '#ef4444' }
        ];

        for (const cat of categories) {
            await prisma.category.create({
                data: { ...cat, companyId: company.id }
            });
        }

        return NextResponse.json({ company }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Error al crear empresa' }, { status: 500 });
    }
}
