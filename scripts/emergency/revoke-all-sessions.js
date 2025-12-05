#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Emergency Script: Revoke All Sessions
 * Cierra todas las sesiones activas de usuarios
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Required for admin operations
);

async function revokeAllSessions() {
    console.log('🚨 REVOKING ALL USER SESSIONS\n');
    console.log('This will log out ALL users immediately.');
    console.log('Use this only during security incidents.\n');

    try {
        // Esta operación requiere el Service Role Key de Supabase
        // Por seguridad, debe estar en variables de entorno del servidor

        const { data, error } = await supabase.auth.admin.listUsers();

        if (error) {
            throw error;
        }

        console.log(`Found ${data.users.length} users\n`);

        let revokedCount = 0;
        for (const user of data.users) {
            try {
                // Sign out user from all sessions
                await supabase.auth.admin.signOut(user.id);
                revokedCount++;
                console.log(`✅ Revoked sessions for: ${user.email}`);
            } catch (err) {
                console.log(`❌ Failed for ${user.email}:`, err.message);
            }
        }

        console.log(`\n✅ Successfully revoked ${revokedCount}/${data.users.length} user sessions`);
        console.log('\n⚠️  All users will need to log in again');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Confirmation prompt
const args = process.argv.slice(2);
if (!args.includes('--confirm')) {
    console.log(`
⚠️  WARNING: This will log out ALL users!

To confirm, run:
  node emergency/revoke-all-sessions.js --confirm

Note: Requires SUPABASE_SERVICE_ROLE_KEY in environment
  `);
    process.exit(0);
}

revokeAllSessions();
