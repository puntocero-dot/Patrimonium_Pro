# 🚀 Guía de Deployment a Producción - Conta2Go

## Pre-requisitos

- [ ] Cuenta en [Vercel](https://vercel.com)
- [ ] Cuenta en [Supabase](https://supabase.com)
- [ ] Repositorio Git (GitHub, GitLab, o Bitbucket)
- [ ] Variables de entorno configuradas

---

## Paso 1: Preparar el Proyecto

### 1.1 Verificar que todo funciona localmente

```bash
# 1. Instalar dependencias limpias
npm ci

# 2. Ejecutar tests de seguridad
npm run security-test

# 3. Verificar build de producción
npm run build

# 4. Verificar que no hay errores de TypeScript
npm run type-check

# 5. Audit de vulnerabilidades
npm audit --audit-level=moderate
```

### 1.2 Crear archivo vercel.json

Ya está creado en la raíz del proyecto con la configuración óptima.

### 1.3 Asegurar que .gitignore está correcto

```bash
# Verificar que estos archivos NO se suben a Git:
.env
.env.local
.env.production
.env.development
node_modules/
.next/
backups/
```

---

## Paso 2: Configurar Supabase Production

### 2.1 Crear proyecto en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Click en "New Project"
3. Configuración:
   - **Name:** conta2go-production
   - **Database Password:** [Generar uno fuerte - guárdalo]
   - **Region:** Closest to your users (ejemplo: South America)
   - **Pricing Plan:** Pro (para producción)

### 2.2 Configurar Authentication

1. En Supabase Dashboard > Authentication > Providers
2. **Email Provider:**
   - ✅ Enable Email provider
   - ✅ Confirm email = **OFF** (para producción controlada) o **ON** (más seguro)
   - ✅ Secure email change = **ON**

3. **URL Configuration:**
   - Site URL: `https://tu-dominio.com`
   - Redirect URLs: Agregar todas estas:
     ```
     https://tu-dominio.com/dashboard
     https://tu-dominio.com/login
     https://tu-dominio.com/register
     https://tu-dominio.com/mfa-setup
     ```

### 2.3 Ejecutar Migraciones de DB

```bash
# 1. Obtener la DATABASE_URL de Supabase
# Settings > Database > Connection string (Direct)

# 2. Ejecutar Prisma migrations
npx prisma db push

# 3. Ejecutar RLS policies
psql $DATABASE_URL < prisma/migrations/rls_policies.sql

# 4. Verificar que las tablas existen
npx prisma studio
```

### 2.4 Obtener Credenciales de Supabase

En Supabase Dashboard > Settings > API:

### 1.2 Crear archivo vercel.json
...

### 2.4 Obtener Credenciales de Supabase

En Supabase Dashboard > Settings > API:

- **Project URL:** `https://xxxxx.supabase.co`
- **anon public key:** `[YOUR_ANON_KEY]`
- **service_role key:** `[YOUR_SERVICE_ROLE_KEY]` (¡MUY SECRETO!)

...

### 3.2 Configurar Environment Variables

En Vercel Project Settings > Environment Variables, agregar:

#### Production Environment

```env
# Database
DATABASE_URL="postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"

# Encryption
ENCRYPTION_MASTER_KEY="[genera-una-clave-segura-de-64-caracteres]"

# App Config
NEXT_PUBLIC_DEFAULT_COUNTRY="SV"
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
NODE_ENV="production"
```

**⚠️ IMPORTANTE:**
- Genera una nueva ENCRYPTION_MASTER_KEY solo para producción
- NUNCA uses las mismas keys de desarrollo
- El service_role_key es MUY sensible - manejar con cuidado

### 3.3 Configurar Dominio Personalizado

1. En Vercel Project > Settings > Domains
2. Agregar tu dominio: `conta2go.com`
3. Configurar DNS según instrucciones de Vercel
4. Esperar a que el SSL se active (automático)

### 3.4 Configurar Build Settings

En Vercel Project > Settings > General:

- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm ci`
- **Node Version:** `18.x` o `20.x`

---

## Paso 4: Configurar GitHub Secrets (para CI/CD)

En tu repositorio GitHub > Settings > Secrets and variables > Actions:

```
SNYK_TOKEN=xxx
SONAR_TOKEN=xxx
SONAR_HOST_URL=https://sonarcloud.io
DATABASE_URL=xxx
DIRECT_URL=xxx
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
ENCRYPTION_MASTER_KEY=xxx
```

---

## Paso 5: Deploy

### 5.1 Deploy Inicial

```bash
# Opción 1: Desde Vercel Dashboard
# Click "Deploy" y espera ~2-3 minutos

# Opción 2: Desde CLI
npm i -g vercel
vercel --prod
```

### 5.2 Verificar Deployment

1. ✅ Build exitoso (sin errores)
2. ✅ Health check: `https://tu-dominio.com/api/health`
3. ✅ Login funciona
4. ✅ MFA funciona
5. ✅ Dashboard carga correctamente

### 5.3 Monitorear Logs

```bash
# Ver logs en tiempo real
vercel logs --follow

# O en Vercel Dashboard > Deployments > View Function Logs
```

---

## Paso 6: Post-Deployment

### 6.1 Crear primer usuario SUPER_ADMIN

```bash
# Opción 1: Desde Supabase Dashboard
# Authentication > Users > Invite User
# Luego actualizar el rol en la tabla User

# Opción 2: Desde SQL
UPDATE "User" 
SET role = 'SUPER_ADMIN' 
WHERE email = 'admin@tuempresa.com';
```

### 6.2 Configurar Backups Automáticos

En Supabase Dashboard > Database > Backups:
- ✅ Enable PITR (Point in Time Recovery)
- ✅ Schedule: Daily at 2 AM

### 6.3 Configurar Alertas

1. **Vercel:**
   - Project > Settings > Notifications
   - Email on deployment failures

2. **Supabase:**
   - Project > Settings > Alerts
   - Database CPU > 80%
   - Storage > 80%

### 6.4 Habilitar Analytics

Vercel > Analytics (automático con plan Pro)

---

## Paso 7: Seguridad en Producción

### 7.1 Verificar Headers de Seguridad

```bash
# Test con securityheaders.com
curl -I https://tu-dominio.com

# Verificar:
✅ Strict-Transport-Security
✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff
✅ Referrer-Policy: origin-when-cross-origin
✅ Content-Security-Policy
```

### 7.2 Ejecutar Security Scan

```bash
# OWASP ZAP scan
zap-cli quick-scan https://tu-dominio.com

# SSL Test
# Ir a: https://www.ssllabs.com/ssltest/
# Debe obtener A o A+
```

### 7.3 Configurar Rate Limiting en Vercel

En vercel.json (ya configurado):
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-RateLimit-Limit", "value": "100" }
      ]
    }
  ]
}
```

---

## Paso 8: Monitoreo Continuo

### 8.1 Setup Sentry (Opcional pero recomendado)

```bash
npm install @sentry/nextjs

# Configurar Sentry según doc oficial
npx @sentry/wizard -i nextjs
```

### 8.2 Setup UptimeRobot (Gratuito)

1. Ir a [UptimeRobot](https://uptimerobot.com)
2. Crear monitor:
   - URL: `https://tu-dominio.com`
   - Interval: 5 minutos
   - Email alerts: ON

---

## Rollback de Emergencia

Si algo sale mal:

```bash
# Opción 1: Desde Vercel Dashboard
# Deployments > [deployment anterior] > Promote to Production

# Opción 2: Desde CLI
vercel rollback

# Opción 3: Git revert
git revert HEAD
git push origin main
# Vercel auto-deploya
```

---

## Checklist Final de Deployment ✅

### Pre-Deploy
- [ ] Todos los tests pasan
- [ ] Build exitoso localmente
- [ ] Variables de entorno configuradas
- [ ] Gitignore correcto
- [ ] Migraciones de DB aplicadas

### Durante Deploy
- [ ] Deploy exitoso sin errores
- [ ] Health check responde
- [ ] SSL certificate activo (A+ rating)
- [ ] Dominio apunta correctamente

### Post-Deploy
- [ ] Login/Register funciona
- [ ] MFA funciona
- [ ] Dashboard carga
- [ ] Audit logs guardan
- [ ] Security Dashboard accesible
- [ ] Backups configurados
- [ ] Alertas configuradas
- [ ] Monitoring activo

### Seguridad
- [ ] Headers de seguridad correctos
- [ ] RLS policies aplicadas
- [ ] Encryption funciona
- [ ] Rate limiting activo
- [ ] HTTPS enforced
- [ ] Secrets seguros (no en código)

---

## Comandos Útiles de Mantenimiento

```bash
# Ver logs de producción
vercel logs --follow

# Ejecutar comando en producción
vercel env pull .env.production

# Re-deploy forzado
vercel --prod --force

# Ver métricas
vercel inspect [URL]
```

---

## Troubleshooting Común

### Error: "Module not found"
```bash
# Limpiar cache y re-instalar
rm -rf node_modules .next
npm ci
npm run build
```

### Error: "Database connection failed"
- Verificar DATABASE_URL en Vercel
- Verificar que Supabase permite conexiones
- Revisar IP allowlist en Supabase

### Error: "Hydration failed"
- Verificar que no hay console.log en producción
- Revisar que componentes Client/Server están correctos

---

## Costos Estimados (Mensual)

**Setup Mínimo Viable:**
- Vercel Pro: **$20/mes**
- Supabase Pro: **$25/mes**
- Dominio: **~$12/año**
- **Total: ~$45/mes + $12/año**

**Setup Recomendado:**
- Vercel Pro: **$20/mes**
- Supabase Pro: **$25/mes**
- Sentry: **$26/mes** (100k events)
- UptimeRobot: **Gratis**
- **Total: ~$71/mes**

---

## Soporte y Recursos

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs

---

**¡Tu aplicación está lista para producción!** 🚀

Última actualización: Sprint 6 - Deployment Guide
