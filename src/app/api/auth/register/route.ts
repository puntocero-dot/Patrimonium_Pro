import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { validatePassword } from '@/lib/auth/password-policy';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // 1. Validate Input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return NextResponse.json(
                { error: passwordValidation.errors[0] },
                { status: 400 }
            );
        }

        // 2. Create user in Supabase Auth
        // Note: This runs on the server, but uses the anon key (client). 
        // This is fine for signup as it's a public endpoint.
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            );
        }

        if (!authData.user) {
            return NextResponse.json(
                { error: 'Failed to create user in authentication provider' },
                { status: 500 }
            );
        }

        // 3. Create user in Prisma Database
        try {
            // Check if user already exists to avoid unique constraint error if retrying
            const existingUser = await prisma.user.findUnique({
                where: { id: authData.user.id }
            });

            if (existingUser) {
                return NextResponse.json({
                    message: 'User already registered',
                    user: existingUser
                });
            }

            const newUser = await prisma.user.create({
                data: {
                    id: authData.user.id,
                    email: authData.user.email!,
                    role: 'CLIENTE', // Default role
                },
            });

            return NextResponse.json({
                message: 'User registered successfully',
                user: newUser
            });

        } catch (dbError: unknown) {
            console.error('Database creation error:', dbError);
            const error = dbError as { code?: string };

            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: 'User already exists in database' },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                { error: 'Failed to create user profile. Please contact support.' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
