# Entorno de Staging y Flujo de Trabajo

## Descripción General

Ahora contamos con un **entorno de staging** que replica producción. Todas las nuevas funcionalidades y cambios de base de datos deben probarse en staging antes de pasar a producción.

| Entorno | URL | Rama | Base de datos |
|---------|-----|------|---------------|
| **Producción** | https://urbancycling.vercel.app | `main` | `urbancycling_db` (Aiven) |
| **Staging** | https://staging-urbancycling.vercel.app | `develop` | `urbancycling_staging_db` (Aiven) |

---

## Flujo de Git

### Estrategia de Ramas

```
main (producción)  ← protegida, requiere PR + aprobación
  ↑
develop (staging)  ← despliega automáticamente a staging
  ↑
feature/*          ← ramas de trabajo
```

### Paso a Paso: Nueva Funcionalidad

1. **Crear una rama de feature desde `develop`:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/mi-nueva-funcionalidad
   ```

2. **Trabajar en el feature:**
   ```bash
   # Hacer los cambios
   git add .
   git commit -m "feat: descripción del cambio"
   git push -u origin feature/mi-nueva-funcionalidad
   ```

3. **Abrir un Pull Request:**
   - Ir a GitHub
   - Abrir PR: `feature/mi-nueva-funcionalidad` → `develop`
   - Completar la descripción del PR
   - Solicitar revisión

4. **Después del merge, probar en staging:**
   - Vercel despliega automáticamente a https://staging-urbancycling.vercel.app
   - Probar la funcionalidad exhaustivamente

5. **Cuando esté listo para producción:**
   - Abrir PR: `develop` → `main`
   - El Scrum Master revisa y aprueba
   - El merge despliega a producción

---

## Migraciones de Base de Datos

### Importante: Acceso a la Base de Datos

Las bases de datos de producción y staging son administradas por el **Scrum Master** (cuenta de Aiven). Los desarrolladores NO tienen acceso directo.

### Cómo Crear una Migración

1. **Modificar `prisma/schema.prisma`** con los cambios

2. **Generar la migración localmente:**
   ```bash
   npx prisma migrate dev --name nombre_de_la_migracion
   ```
   Esto crea un nuevo archivo en `prisma/migrations/`

3. **Commitear el archivo de migración:**
   ```bash
   git add prisma/migrations/
   git commit -m "feat(db): agregar nueva tabla para funcionalidad X"
   ```

4. **Incluir la migración en el PR** a `develop`

### Cómo se Aplican las Migraciones

| Entorno | Quién aplica | Cómo |
|---------|--------------|------|
| **Staging** | Scrum Master | `npx prisma migrate deploy` con `DATABASE_URL` de staging |
| **Producción** | Scrum Master | `npx prisma migrate deploy` con `DATABASE_URL` de producción |

### Flujo de Migraciones

```
1. Dev crea la migración localmente
2. Dev incluye la migración en el PR → develop
3. Scrum Master mergea el PR a develop
4. Scrum Master ejecuta: npx prisma migrate deploy (staging)
5. Scrum Master verifica que staging funcione
6. Scrum Master mergea develop → main
7. Scrum Master ejecuta: npx prisma migrate deploy (producción)
```

### Reglas Críticas

- **NUNCA** ejecutar `prisma migrate deploy` en producción por tu cuenta
- **NUNCA** ejecutar `prisma db push` — siempre usar migraciones
- **SIEMPRE** probar migraciones localmente primero
- **SIEMPRE** incluir los archivos de migración en el PR
- **NUNCA** modificar archivos de migración existentes — crear nuevos

---

## Variables de Entorno

### Desarrollo Local

Crear un archivo `.env.local` (nunca committear):

```env
DATABASE_URL=mysql://usuario:contraseña@host:puerto/urbancycling_db?ssl-mode=REQUIRED
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-local
CLOUDFLARE_ACCOUNT_ID=tu-account-id
CLOUDFLARE_ACCESS_KEY_ID=tu-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=tu-secret-key
CLOUDFLARE_R2_BUCKET_NAME=urbancycling-prod
NEXT_PUBLIC_R2_PUBLIC_URL=https://tu-cdn-url.com
RESEND_API_KEY=tu-key-de-resend
TAX_ISSUER_RUT=76.633.070-3
```

### Staging (Vercel)

El Scrum Master configura estas variables en la configuración del proyecto de Vercel. NO committear credenciales de staging.

### Producción (Vercel)

El Scrum Master configura estas variables en la configuración del proyecto de Vercel. NO committear credenciales de producción.

---

## Despliegues

### Despliegues Automáticos

| Rama | Entorno | Disparador |
|------|---------|------------|
| `develop` | Staging | Push a `develop` (vía merge de PR) |
| `main` | Producción | Push a `main` (vía merge de PR) |

### Despliegues Manuales

Si necesitás disparar un despliegue manual:
1. Ir al dashboard de Vercel
2. Seleccionar el proyecto
3. Click en "Redeploy"

---

## Problemas Comunes

### "No autorizado" en rutas de API

Es normal — la API requiere autenticación. Iniciá sesión primero.

### Conflictos de migraciones

Si tenés un conflicto de migración:
```bash
# Resetear base de datos local (¡solo local!)
npx prisma migrate reset
```

### Staging está roto

Si staging se rompe después de un merge:
1. Revisar los logs de deploy en Vercel
2. Verificar si las migraciones se aplicaron
3. Contactar al Scrum Master

### Mi PR está estancado

Asegurate de que:
- El PR apunta a `develop` (no a `main`)
- Todos los checks pasen
- Solicitaste una revisión

---

## Referencia Rápida

| Tarea | Comando |
|-------|---------|
| Empezar nuevo feature | `git checkout develop && git pull && git checkout -b feature/nombre` |
| Correr servidor dev | `npm run dev` |
| Correr migraciones (local) | `npx prisma migrate dev` |
| Resetear BD local | `npx prisma migrate reset` |
| Generar cliente Prisma | `npx prisma generate` |
| Poblar base de datos | `npm run seed` |
| Verificar tipos | `npm run typecheck` |
| Lint | `npm run lint` |

---

## Contacto

Para problemas con:
- **Acceso a base de datos**: Contactar al Scrum Master
- **Entorno de staging**: Contactar al Scrum Master
- **Despliegues a producción**: Contactar al Scrum Master
- **Revisiones de código**: Solicitar revisión en el PR

---

## Resumen

1. **Siempre** crear rama desde `develop`
2. **Siempre** abrir PRs a `develop`
3. **Siempre** probar en staging antes de producción
4. **Nunca** pushear directamente a `main` o `develop`
5. **Nunca** correr migraciones en producción
6. **Siempre** incluir archivos de migración en los PRs
