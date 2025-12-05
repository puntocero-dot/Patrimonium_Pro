import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const startTime = Date.now();

    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;

        const responseTime = Date.now() - startTime;

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                api: 'operational',
            },
            responseTime: `${responseTime}ms`,
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV,
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: 'Database connection failed',
            },
            { status: 503 }
        );
    }
}
