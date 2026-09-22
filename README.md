# 🚲 Urban Cycling Dashboard

Sistema de gestión integral para tiendas de ciclismo urbano. Permite administrar clientes, inventario, bicicletas, punto de venta, órdenes de trabajo y documentos tributarios desde una sola plataforma web.

> Proyecto universitario — Ingeniería de Software II, Semestre 8.

---

## ⚡ Inicio rápido

```bash
git clone https://github.com/1xMxtixs/UrbanCycling_Dashboard.git
cd UrbanCycling_Dashboard
npm install              # también ejecuta `prisma generate`
docker-compose up -d     # MySQL 8.0 en el puerto 3306
# crea el archivo .env (ver "Variables de Entorno")
npx prisma migrate dev
npm run seed
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) e ingresa con `admin@urbancycling.cl` / `admin123` (usuario creado por el seed).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) con App Router + Turbopack |
| Lenguaje | TypeScript |
| ORM | [Prisma 7](https://www.prisma.io/) con adaptador MariaDB |
| Base de Datos | MySQL 8.0 / MariaDB (local vía Docker, producción en Aiven) |
| Autenticación | [NextAuth v4](https://next-auth.js.org/) (Credentials + JWT) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + Radix UI |
| Estilos | Tailwind CSS v4 |
| Almacenamiento | Cloudflare R2 (API compatible con S3) |
| Correo | [Resend](https://resend.com/) (recuperación de contraseña) |
| Formularios | React Hook Form + Zod |
| Tablas | TanStack Table |
| PDF | jsPDF + html2canvas-pro |
| Despliegue | Vercel |

---

## 📦 Módulos del Sistema

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| 🏪 **Punto de Venta** | `/punto-ventas/ventas` | Ventas en caja con productos y servicios |
| 🔧 **Órdenes de Trabajo** | `/punto-ventas/ordenes-trabajo` | Reparaciones: servicios, insumos, fotos, auditoría y tiempo de servicio |
| 📦 **Inventario** | `/inventory` | Productos, categorías, movimientos de bodega y alertas de stock bajo |
| 🚲 **Bicicletas** | `/bicicletas` | Registro de bicicletas de clientes |
| 👥 **Clientes** | `/clientes` | Gestión de clientes y su historial |
| 📄 **Historial de Boletas** | `/historial-boletas` | Consulta de documentos tributarios emitidos |
| 👤 **Usuarios** | `/usuarios` | Cuentas, roles y matriz de permisos |
| 🙍 **Perfil** | `/perfil` | Datos personales y cambio de contraseña |

---

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos (valores de docker-compose.yml)
DATABASE_URL="mysql://cycling_admin:cycling_secure_password@localhost:3306/urbancycling_db"
# Solo para MySQL administrado con TLS (ej. Aiven). PEM completo; se aceptan "\n" escapados.
# DATABASE_CA_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"

# NextAuth
NEXTAUTH_SECRET="tu_secreto_aqui"
NEXTAUTH_URL="http://localhost:3000"

# Resend (requerido para recuperación de contraseña)
RESEND_API_KEY="re_..."

# Cloudflare R2 (opcional: sin estas variables las imágenes se guardan en public/uploads/)
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_ACCESS_KEY_ID=""
CLOUDFLARE_SECRET_ACCESS_KEY=""
CLOUDFLARE_R2_BUCKET_NAME=""
NEXT_PUBLIC_R2_PUBLIC_URL=""

# Documentos tributarios (opcional, por defecto 76.633.070-3)
TAX_ISSUER_RUT=""
```

---

## 🗄️ Base de Datos

- Las migraciones incluyen **procedimientos almacenados** (descuento/ajuste de stock, folios, reporte diario). El motor debe soportarlos: MySQL o MariaDB sirven, TiDB **no**.
- El cliente de Prisma se genera en `generated/prisma`. Tras cambiar `prisma/schema.prisma`, ejecuta `npx prisma generate`.
- En producción las migraciones se aplican manualmente con `npx prisma migrate deploy` apuntando a la base de Aiven.

---

## 🧑‍💻 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Compila para producción |
| `npm run start` | Servidor en modo producción |
| `npm run lint` | ESLint |
| `npm run format` | Formatea con Prettier |
| `npm run typecheck` | Verifica tipos con TypeScript |
| `npm run seed` | Pobla la base con roles, usuarios y datos de ejemplo |

---

## 📁 Estructura del Proyecto

```
UrbanCycling_Dashboard/
├── app/
│   ├── (auth)/(routes)/     # sign-in, forgot-password, reset-password
│   ├── (routes)/            # Páginas protegidas del dashboard
│   │   ├── bicicletas/
│   │   ├── clientes/
│   │   ├── historial-boletas/
│   │   ├── inventory/
│   │   ├── perfil/
│   │   ├── punto-ventas/    # ventas/ y ordenes-trabajo/
│   │   └── usuarios/
│   └── api/                 # Endpoints REST protegidos por permisos
├── components/              # Componentes compartidos (carpeta + index.ts)
│   └── ui/                  # Primitivas shadcn/ui
├── generated/prisma/        # Cliente Prisma generado
├── hooks/                   # Custom React hooks
├── lib/                     # Auth, permisos, conexión a BD, mailer
├── prisma/                  # Schema, migraciones y seed
├── proxy.ts                 # Middleware: protege rutas de páginas
└── docker-compose.yml       # MySQL local
```

### Permisos

Cada usuario tiene un rol con permisos (ej. `inventory:read`) que viajan en la sesión. Al agregar un módulo nuevo hay que actualizar **tres** lugares, porque ninguno valida a los otros:

1. `lib/permissions.ts` — código del permiso.
2. `app/api/**/route.ts` — `requirePermission(PERMISSIONS.X)`.
3. `proxy.ts` (matcher) y `components/SidebarRoutes/SidebarRoutes.data.ts` (menú).

---

## 🤝 Contribución

1. Crea una rama desde `main`:
   ```bash
   git checkout -b feature/nombre-de-la-feature
   ```
2. Haz commit siguiendo [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat(inventario): descripción del cambio"
   ```
3. Verifica con `npm run lint` y `npm run typecheck`.
4. Sube tu rama y abre un Pull Request hacia `main`.

---

## 👨‍💻 Equipo

Desarrollado por el equipo de ISW II — Semestre 8.

---

## 📄 Licencia

Proyecto académico — uso educativo.
