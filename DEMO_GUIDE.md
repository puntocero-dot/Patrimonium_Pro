## 🎯 GUÍA RÁPIDA DE DEMO - CONTA2GO

### ⚡ INICIO RÁPIDO

1. **Iniciar servidor:**
```bash
npm run dev
```

2. **Abrir:** http://localhost:3001

3. **Login** con tu usuario o crear cuenta nueva

---

## 🎬 SCRIPT DE DEMO (5 minutos)

### 📍 **Paso 1: Login & Dashboard (30 seg)**
- Mostrar login seguro
- Dashboard con sidebar profesional
- Mencionar: "Seguridad de nivel bancario con MFA, encriptación AES-256"

### 📍 **Paso 2: Crear Empresa (1 min)**
1. Click en **🏢 Empresas** (sidebar)
2. Click **+ Nueva Empresa**
3. Llenar formulario:
   - Forma jurídica: **S.A. de C.V.**
   - Nombre: **Demo Company S.A.**
   - NIT: **0614-210188-101-2**
   - NRC: **123456**
   - Actividad: **Servicios profesionales**
   - Capital: **$2,000**
   - Dirección: **San Salvador, Colonia Escalón**
4. Guardar

**Mensaje clave:** *"Sistema basado en legislación salvadoreña del Código de Comercio"*

### 📍 **Paso 3: Gestión de Clientes (1 min)**
1. Click en **👥 Clientes**
2. Click **+ Nuevo Cliente**
3. Crear cliente:
   - Tipo: **Persona**
   - Nombre: **Juan Pérez**
   - Email: **juan@demo.com**
   - Teléfono: **+503 7123-4567**
   - DUI: **01234567-8**
4. Guardar

**Mensaje clave:** *"CRM integrado para gestión de clientes y proveedores"*

### 📍 **Paso 4: Transacciones (1.5 min)**
1. Click en **💰 Transacciones**
2. Click **+ Nueva Transacción**
3. Crear ingreso:
   - Tipo: **Ingreso**
   - Monto: **$1,500**
   - Descripción: **Venta de servicios**
   - Fecha: Hoy
4. Crear egreso:
   - Tipo: **Egreso**
   - Monto: **$500**
   - Descripción: **Compra de suministros**

**Mostrar:**
- Tarjetas de estadísticas actualizándose
- Filtros (Ingresos/Egresos)
- Balance en tiempo real

**Mensaje clave:** *"Control total de flujo de caja en tiempo real"*

### 📍 **Paso 5: Reportes Financieros (1 min)**
1. Click en **📊 Reportes**
2. Seleccionar mes actual
3. Mostrar:
   - ✅ Total ingresos: $1,500
   - ✅ Total egresos: $500
   - ✅ Balance: $1,000
   - ✅ **IVA Calculado (13%)**: $195.00
   - ✅ Desglose por categoría
   - ✅ Estadísticas del período

**Mensaje clave:** *"Reportes automáticos con cálculo de IVA según legislación de El Salvador"*

---

## 🎯 PUNTOS CLAVE PARA MENCIONAR

### 🔐 Seguridad (Diferenciador #1)
- ✅ Autenticación multi-factor (MFA)
- ✅ Encriptación AES-256-GCM
- ✅ Audit logs completos
- ✅ Row Level Security (RLS)
- ✅ Rate limiting anti-ataques
- ✅ Session management

### 🌎 Multi-País (Diferenciador #2)
- ✅ 6 países soportados (SV, GT, HN, NI, CR, PA)
- ✅ Cálculo automático de IVA por país
- ✅ Validación de documentos (NIT, NRC, DUI)
- ✅ Configuración regional

### 💼 Funcionalidades
- ✅ Gestión de empresas (según código de comercio SV)
- ✅ CRM de clientes y proveedores
- ✅ Transacciones (ingresos/egresos)
- ✅ Reportes financieros con IVA
- ✅ Categorización automática
- ✅ Dashboard con estadísticas

### 🚀 Tecnología
- Next.js 15 + React 18
- Supabase (PostgreSQL + Auth)
- Prisma ORM
- TypeScript
- CI/CD con GitHub Actions

---

## 📊 DATOS DE EJEMPLO PARA DEMO

### Empresas:
```
Demo Company S.A. de C.V.
NIT: 0614-210188-101-2
NRC: 123456
Capital: $2,000
```

### Clientes:
```
Juan Pérez (Persona)
DUI: 01234567-8
Tel: +503 7123-4567

Empresa Demo S.A. (Empresa)
NIT: 0614-210188-102-3
NRC: 654321
```

### Transacciones Sugeridas:
```
Ingresos:
- Venta de servicios: $1,500
- Consultoría: $2,000
- Productos: $800

Egresos:
- Alquiler oficina: $500
- Salarios: $1,200
- Suministros: $300
```

---

## 🎤 RESPUESTAS A PREGUNTAS FRECUENTES

### "¿Qué los diferencia de QuickBooks/Xero?"
**R:** *"Somos la única solución diseñada específicamente para El Salvador y Centroamérica, con:*
- *Validación automática de NIT/NRC/DUI*
- *Cálculo de IVA según legislación local*
- *Formas jurídicas del código de comercio salvadoreño*
- *Seguridad bancaria (no solo contable)"*

### "¿Cuánto cuesta?"
**R:** *"Modelo freemium:*
- *Básico: GRATIS (hasta 50 transacciones/mes)*
- *Pro: $29/mes (ilimitado + facturación electrónica)*
- *Enterprise: $99/mes (múltiples empresas + API)"*

### "¿Cuándo estará disponible?"
**R:** *"Beta cerrada: Enero 2025*
*Lanzamiento público: Marzo 2025"*

### "¿Tienen app móvil?"
**R:** *"PWA disponible ahora (funciona como app)*
*Apps nativas iOS/Android: Q2 2025"*

---

## 🚀 CIERRE DE DEMO

**Llamado a la acción:**
1. "¿Les gustaría ser parte del programa de beta?"
2. "Tenemos espacios limitados para early adopters"
3. "Incluye 3 meses gratis del plan Pro"

**Contacto:**
- Email: contacto@conta2go.com
- WhatsApp: +503 XXXX-XXXX

---

## ⚡ COMANDOS ÚTILES

```bash
# Desarrollo
npm run dev              # Servidor local
npm run build            # Build producción
npm run start            # Servidor producción

# Base de datos
npx prisma studio        # Ver datos
npx prisma db push       # Aplicar cambios

# Tests
npm run test             # Tests unitarios
npm run security-test    # Tests de seguridad

# Deployment
vercel                   # Deploy a Vercel
```

---

## 📋 CHECKLIST PRE-DEMO

- [ ] Servidor corriendo sin errores
- [ ] Base de datos con datos de prueba
- [ ] Usuario demo creado
- [ ] Empresa demo creada
- [ ] Transacciones de ejemplo
- [ ] Navegador en pantalla completa
- [ ] Sin notificaciones/distracciones
- [ ] Internet estable
- [ ] Plan B (screenshots/video) listo

---

## 🎯 MÉTRICAS A MOSTRAR

- **6 sprints de seguridad** completados
- **200+ security checks** implementados
- **6 países** soportados
- **100% uptime** objetivo
- **Encriptación** de grado militar
- **Cumplimiento** GDPR/SOC2 ready

---

**¡ÉXITO EN TU DEMO!** 🚀
