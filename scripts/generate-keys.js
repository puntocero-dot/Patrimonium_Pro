#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Genera claves de encriptación seguras para producción
 */

const crypto = require('crypto');

console.log('\n🔐 Generador de Claves de Encriptación\n');
console.log('='.repeat(60));

// Generar ENCRYPTION_MASTER_KEY
const masterKey = crypto.randomBytes(32).toString('hex');
console.log('\n📋 ENCRYPTION_MASTER_KEY (64 caracteres):');
console.log(masterKey);

// Generar API Keys adicionales si se necesitan
const apiKey = crypto.randomBytes(32).toString('hex');
console.log('\n📋 API_KEY (opcional):');
console.log(apiKey);

// Generar JWT Secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\n📋 JWT_SECRET (opcional):');
console.log(jwtSecret);

console.log('\n' + '='.repeat(60));
console.log('\n⚠️  IMPORTANTE:');
console.log('   1. Guarda estas claves en un lugar SEGURO');
console.log('   2. NUNCA las commitees a Git');
console.log('   3. Usa diferentes claves para producción y desarrollo');
console.log('   4. Rota las claves cada 90 días\n');
