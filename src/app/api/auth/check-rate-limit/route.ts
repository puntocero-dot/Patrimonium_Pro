import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/auth/rate-limiter';

export async function POST(request: NextRequest) {
    try {
        const { identifier } = await request.json();

        if (!identifier) {
            return NextResponse.json(
                { error: 'Identifier is required' },
                { status: 400 }
            );
        }

        const result = checkRateLimit(identifier);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error checking rate limit:', error);
        return NextResponse.json(
            { allowed: true }, // Fail-safe: permitir en caso de error
            { status: 200 }
        );
    }
}
