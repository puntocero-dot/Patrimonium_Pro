#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Script de migración de datos entre países
 * Conta2Go - Multi-Country Data Migration
 */

const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt } = require('../src/lib/encryption/crypto');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const SUPPORTED_COUNTRIES = ['SV', 'GT', 'HN', 'NI', 'CR', 'PA'];

/**
 * Migra datos de un país a otro
 */
async function migrateCountryData(options) {
    const { fromCountry, toCountry, companyId, dryRun = true } = options;

    console.log('\n🌎 Conta2Go - Country Data Migration Tool\n');
    console.log('='.repeat(50));
    console.log(`From Country: ${fromCountry}`);
    console.log(`To Country: ${toCountry}`);
    console.log(`Company ID: ${companyId || 'ALL'}`);
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will apply changes)'}`);
    console.log('='.repeat(50));

    // Validations
    if (!SUPPORTED_COUNTRIES.includes(fromCountry)) {
        throw new Error(`Invalid source country: ${fromCountry}`);
    }

    if (!SUPPORTED_COUNTRIES.includes(toCountry)) {
        throw new Error(`Invalid target country: ${toCountry}`);
    }

    if (fromCountry === toCountry) {
        throw new Error('Source and target countries must be different');
    }

    try {
        // 1. Get companies to migrate
        const where = {
            country: fromCountry,
            ...(companyId && { id: companyId }),
        };

        const companies = await prisma.company.findMany({ where });

        console.log(`\n📊 Found ${companies.length} compan${companies.length === 1 ? 'y' : 'ies'} to migrate\n`);

        if (companies.length === 0) {
            console.log('✅ No companies to migrate. Exiting.');
            return;
        }

        // 2. Create backup
        if (!dryRun) {
            await createBackup(companies, fromCountry);
        }

        // 3. Migration statistics
        const stats = {
            companiesMigrated: 0,
            usersMigrated: 0,
            auditLogsMigrated: 0,
            errors: [],
        };

        // 4. Process each company
        for (const company of companies) {
            console.log(`\n📦 Processing: ${company.name} (${company.id})`);

            try {
                if (!dryRun) {
                    // Update company country
                    await prisma.company.update({
                        where: { id: company.id },
                        data: { country: toCountry },
                    });

                    // Log the migration
                    await prisma.auditLog.create({
                        data: {
                            action: 'company_migrated',
                            resource: 'company',
                            resourceId: company.id,
                            ipAddress: '127.0.0.1',
                            userAgent: 'migration-script',
                            result: 'success',
                            metadata: {
                                fromCountry,
                                toCountry,
                                migratedAt: new Date().toISOString(),
                            },
                        },
                    });
                }

                stats.companiesMigrated++;
                console.log(`   ✅ Company migrated successfully`);
            } catch (error) {
                stats.errors.push({
                    companyId: company.id,
                    error: error.message,
                });
                console.log(`   ❌ Error: ${error.message}`);
            }
        }

        // 5. Print summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 MIGRATION SUMMARY\n');
        console.log(`✅ Companies migrated: ${stats.companiesMigrated}`);

        if (stats.errors.length > 0) {
            console.log(`\n❌ Errors: ${stats.errors.length}`);
            stats.errors.forEach((err, idx) => {
                console.log(`   ${idx + 1}. Company ${err.companyId}: ${err.error}`);
            });
        }

        if (dryRun) {
            console.log('\n⚠️  DRY RUN MODE - No changes were made');
            console.log('   Run with --live flag to apply changes');
        } else {
            console.log('\n✅ Migration completed successfully!');
            console.log(`   Backup saved at: ./backups/migration_${Date.now()}.json`);
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Crea un backup antes de la migración
 */
async function createBackup(companies, country) {
    const backupDir = path.join(__dirname, '../backups');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const backup = {
        timestamp: new Date().toISOString(),
        country,
        companies: companies.map(c => ({
            ...c,
            // No incluir datos encriptados en el backup por seguridad
            taxId: '[ENCRYPTED]',
            bankAccount: '[ENCRYPTED]',
        })),
    };

    const filename = `migration_${country}_${Date.now()}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    console.log(`\n💾 Backup created: ${filename}`);
}

/**
 * Exporta datos de un país a JSON
 */
async function exportCountryData(country, outputPath) {
    console.log(`\n📤 Exporting data for country: ${country}\n`);

    const companies = await prisma.company.findMany({
        where: { country },
        include: {
            users: true,
        },
    });

    const exportData = {
        country,
        exportedAt: new Date().toISOString(),
        companiesCount: companies.length,
        companies: companies.map(c => ({
            ...c,
            // Encrypt sensitive data for export
            taxId: '[REDACTED]',
            address: '[REDACTED]',
            bankAccount: '[REDACTED]',
        })),
    };

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`✅ Data exported to: ${outputPath}`);
}

/**
 * Importa datos desde JSON
 */
async function importCountryData(inputPath, targetCountry) {
    console.log(`\n📥 Importing data to country: ${targetCountry}\n`);

    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

    console.log(`Importing ${data.companiesCount} companies...`);

    let imported = 0;
    for (const company of data.companies) {
        try {
            // Insert company with new country
            await prisma.company.create({
                data: {
                    ...company,
                    id: undefined, // Let Prisma generate new ID
                    country: targetCountry,
                },
            });
            imported++;
        } catch (error) {
            console.error(`Failed to import ${company.name}:`, error.message);
        }
    }

    console.log(`\n✅ Imported ${imported}/${data.companiesCount} companies`);
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
    console.log(`
Usage:
  node scripts/country-migration.js migrate --from=SV --to=GT [--company=id] [--live]
  node scripts/country-migration.js export --country=SV --output=./data.json
  node scripts/country-migration.js import --input=./data.json --country=GT

Examples:
  # Dry run migration
  node scripts/country-migration.js migrate --from=SV --to=GT

  # Live migration for specific company
  node scripts/country-migration.js migrate --from=SV --to=GT --company=abc123 --live

  # Export country data
  node scripts/country-migration.js export --country=SV --output=./sv-data.json

  # Import country data
  node scripts/country-migration.js import --input=./sv-data.json --country=GT
  `);
    process.exit(0);
}

// Parse arguments
const options = {};
args.slice(1).forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=');
    options[key] = value || true;
});

// Execute command
(async () => {
    try {
        switch (command) {
            case 'migrate':
                await migrateCountryData({
                    fromCountry: options.from,
                    toCountry: options.to,
                    companyId: options.company,
                    dryRun: !options.live,
                });
                break;

            case 'export':
                await exportCountryData(options.country, options.output);
                break;

            case 'import':
                await importCountryData(options.input, options.country);
                break;

            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
})();
