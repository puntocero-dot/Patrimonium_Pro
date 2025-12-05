import { NextRequest, NextResponse } from 'next/server';
import { clearRateLimit } from '@/lib/auth/rate-limiter';

export async function POST(request: NextRequest) {
    try {
        const { identifier } = await request.json();

        if (!identifier) {
            return NextResponse.json(
                { error: 'Identifier is required' },
                { status: 400 }
            );
        }

        clearRateLimit(identifier);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error clearing rate limit:', error);
        return NextResponse.json(
            { success: false },
            { status: 500 }
        );
    }
}
