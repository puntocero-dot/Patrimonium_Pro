#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Emergency Script: Full Backup
 * Crea backup completo de la base de datos
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

async function createFullBackup() {
    console.log('💾 Iniciando backup completo de emergencia...\n');

    // Crear directorio de backups si no existe
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const backupFile = path.join(BACKUP_DIR, `emergency_backup_${timestamp}.sql`);

    // Obtener DATABASE_URL del .env
    const envPath = path.join(__dirname, '../../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const dbUrlMatch = envContent.match(/DATABASE_URL="(.+)"/);

    if (!dbUrlMatch) {
        throw new Error('DATABASE_URL not found in .env.local');
    }

    const databaseUrl = dbUrlMatch[1];

    return new Promise((resolve, reject) => {
        // Usar pg_dump para crear backup
        const command = `pg_dump "${databaseUrl}" > "${backupFile}"`;

        console.log('Ejecutando pg_dump...');

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Error durante backup:', error.message);
                reject(error);
                return;
            }

            const stats = fs.statSync(backupFile);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            console.log('\n✅ BACKUP COMPLETADO');
            console.log(`   Archivo: ${backupFile}`);
            console.log(`   Tamaño: ${sizeMB} MB`);
            console.log(`   Fecha: ${new Date().toLocaleString('es-MX')}`);
            console.log('\n⚠️  GUARDA ESTE ARCHIVO EN UN LUGAR SEGURO');

            resolve(backupFile);
        });
    });
}

// Ejecutar
createFullBackup().catch(error => {
    console.error('Failed to create backup:', error);
    process.exit(1);
});
