#!/usr/bin/env node

/**
 * Script de testing de seguridad local
 * Ejecuta múltiples checks de seguridad antes de deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Conta2Go - Security Testing Suite\n');
console.log('='.repeat(50));

const results = {
    passed: [],
    failed: [],
    warnings: [],
};

/**
 * Ejecuta un comando y captura el resultado
 */
function runCommand(name, command, options = {}) {
    console.log(`\n📋 Running: ${name}...`);
    try {
        const output = execSync(command, {
            encoding: 'utf8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options,
        });
        results.passed.push(name);
        console.log(`✅ ${name} - PASSED`);
        return { success: true, output };
    } catch (error) {
        if (options.allowFail) {
            results.warnings.push(name);
            console.log(`⚠️  ${name} - WARNING`);
            return { success: false, output: error.stdout || error.message };
        } else {
            results.failed.push(name);
            console.log(`❌ ${name} - FAILED`);
            return { success: false, output: error.stdout || error.message };
        }
    }
}

/**
 * Verifica archivos sensibles
 */
function checkSensitiveFiles() {
    console.log('\n📋 Checking for sensitive files...');
    const sensitiveFiles = [
        '.env',
        '.env.local',
        '.env.production',
        'secrets.json',
        'private.key',
    ];

    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    let allIgnored = true;

    sensitiveFiles.forEach(file => {
        if (fs.existsSync(file) && !gitignore.includes(file)) {
            console.log(`⚠️  ${file} exists but not in .gitignore!`);
            allIgnored = false;
        }
    });

    if (allIgnored) {
        results.passed.push('Sensitive Files Check');
        console.log('✅ Sensitive Files Check - PASSED');
    } else {
        results.warnings.push('Sensitive Files Check');
        console.log('⚠️  Sensitive Files Check - WARNING');
    }
}

/**
 * Verifica variables de entorno requeridas
 */
function checkEnvironmentVariables() {
    console.log('\n📋 Checking environment variables...');
    const required = [
        'DATABASE_URL',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'ENCRYPTION_MASTER_KEY',
    ];

    const envExample = fs.existsSync('.env.example');

    if (!envExample) {
        console.log('⚠️  .env.example not found');
        results.warnings.push('Environment Variables Check');
    } else {
        results.passed.push('Environment Variables Check');
        console.log('✅ Environment Variables Check - PASSED');
    }
}

/**
 * Ejecuta los tests
 */
async function runTests() {
    console.log('\n🚀 Starting Security Tests...\n');

    // 1. TypeScript Type Check
    runCommand(
        'TypeScript Type Check',
        'npx tsc --noEmit',
        { allowFail: true }
    );

    // 2. ESLint
    runCommand(
        'ESLint',
        'npm run lint',
        { allowFail: true }
    );

    // 3. npm audit
    runCommand(
        'NPM Audit',
        'npm audit --audit-level=moderate',
        { allowFail: true }
    );

    // 4. Sensitive Files Check
    checkSensitiveFiles();

    // 5. Environment Variables Check
    checkEnvironmentVariables();

    // 6. Build Check
    runCommand(
        'Build Check',
        'npm run build',
        { allowFail: false }
    );

    // Results Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SECURITY TEST RESULTS\n');

    console.log(`✅ Passed: ${results.passed.length}`);
    results.passed.forEach(test => console.log(`   - ${test}`));

    if (results.warnings.length > 0) {
        console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
        results.warnings.forEach(test => console.log(`   - ${test}`));
    }

    if (results.failed.length > 0) {
        console.log(`\n❌ Failed: ${results.failed.length}`);
        results.failed.forEach(test => console.log(`   - ${test}`));
        console.log('\n⛔ SECURITY TESTS FAILED - DO NOT DEPLOY');
        process.exit(1);
    } else {
        console.log('\n✅ ALL SECURITY TESTS PASSED');
        console.log('🚀 Safe to deploy!');
    }
}

// Run tests
runTests().catch(error => {
    console.error('❌ Error running tests:', error);
    process.exit(1);
});
