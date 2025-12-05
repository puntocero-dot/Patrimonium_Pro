#!/usr/bin/env node

/**
 * Emergency Script: Maintenance Mode
 * Activa/desactiva modo de mantenimiento
 */

const fs = require('fs');
const path = require('path');

const MAINTENANCE_FILE = path.join(__dirname, '../../.maintenance');
const PUBLIC_DIR = path.join(__dirname, '../../public');
const MAINTENANCE_PAGE = path.join(PUBLIC_DIR, 'maintenance.html');

function enableMaintenanceMode() {
    // Crear archivo de flag
    fs.writeFileSync(MAINTENANCE_FILE, JSON.stringify({
        enabled: true,
        enabledAt: new Date().toISOString(),
        reason: 'Security incident - Emergency maintenance',
    }));

    // Crear página de mantenimiento
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mantenimiento - Conta2Go</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 2rem;
    }
    .container {
      text-align: center;
      max-width: 600px;
    }
    .icon { font-size: 5rem; margin-bottom: 2rem; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    p { font-size: 1.2rem; opacity: 0.9; line-height: 1.6; }
    .time { margin-top: 2rem; font-size: 0.9rem; opacity: 0.7; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔧</div>
    <h1>Estamos en Mantenimiento</h1>
    <p>Conta2Go está temporalmente fuera de servicio por mantenimiento de emergencia.</p>
    <p>Volveremos pronto. Disculpa las molestias.</p>
    <div class="time">
      Inicio: ${new Date().toLocaleString('es-MX')}
    </div>
  </div>
</body>
</html>
  `;

    fs.writeFileSync(MAINTENANCE_PAGE, html);

    console.log('🔧 MODO MANTENIMIENTO ACTIVADO');
    console.log('   Archivo de flag creado: .maintenance');
    console.log('   Página de mantenimiento: public/maintenance.html');
    console.log('\n⚠️  Actualiza tu middleware.ts para verificar el archivo .maintenance');
}

function disableMaintenanceMode() {
    // Eliminar archivo de flag
    if (fs.existsSync(MAINTENANCE_FILE)) {
        fs.unlinkSync(MAINTENANCE_FILE);
    }

    // Eliminar página de mantenimiento
    if (fs.existsSync(MAINTENANCE_PAGE)) {
        fs.unlinkSync(MAINTENANCE_PAGE);
    }

    console.log('✅ MODO MANTENIMIENTO DESACTIVADO');
    console.log('   Sistema restaurado a operación normal');
}

// CLI
const args = process.argv.slice(2);
const action = args.find(arg => arg.includes('--enable') || arg.includes('--disable'));

if (!action) {
    console.log(`
Uso:
  node emergency/maintenance-mode.js --enable
  node emergency/maintenance-mode.js --disable

Descripción:
  Activa/desactiva el modo de mantenimiento de emergencia.
  Útil durante respuesta a incidentes de seguridad.
  `);
    process.exit(0);
}

if (action.includes('--enable')) {
    enableMaintenanceMode();
} else if (action.includes('--disable')) {
    disableMaintenanceMode();
}
