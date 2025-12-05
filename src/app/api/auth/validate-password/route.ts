import { NextRequest, NextResponse } from 'next/server';
import { validatePasswordSecurity } from '@/lib/auth/hibp-validator';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json(
                { error: 'Password is required' },
                { status: 400 }
            );
        }

        const result = await validatePasswordSecurity(password);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error validating password:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
