# 🚲 Urban Cycling Dashboard

Sistema de gestión integral para tiendas de ciclismo urbano. Permite administrar clientes, inventario, bicicletas, punto de venta, órdenes de trabajo y documentos tributarios desde una sola plataforma web.

> Proyecto universitario — Ingeniería de Software I, Semestre 7.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) con App Router |
| Lenguaje | TypeScript |
| ORM | [Prisma 7](https://www.prisma.io/) con adaptador MariaDB |
| Base de Datos | MySQL 8.0 / MariaDB (vía Docker) |
| Autenticación | [NextAuth v4](https://next-auth.js.org/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + Radix UI |
| Estilos | Tailwind CSS v4 |
| Almacenamiento | AWS S3 (para archivos e imágenes) |
| Formularios | React Hook Form + Zod |
| Tablas | TanStack Table |

---

## 📦 Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| 🏪 **Punto de Venta** | Gestión de ventas, boletas y transacciones en caja |
| 📦 **Inventario** | Control de stock de productos y repuestos |
| 🚲 **Bicicletas** | Registro y seguimiento de bicicletas en taller |
| 👥 **Clientes** | CRUD de clientes y su historial |
| 🔧 **Órdenes de Trabajo (ODT)** | Gestión de órdenes de reparación y mantención |
| 📄 **Historial de Boletas** | Consulta y reporte de documentos de venta |
| 🧾 **Documentos Tributarios** | Generación y consulta de documentos legales |
| 👤 **Usuarios** | Administración de cuentas y roles del sistema |

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- [Node.js](https://nodejs.org/) >= 20
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

### 1. Clonar el repositorio

```bash
git clone https://github.com/1xMxtixs/UrbanCycling_Dashboard.git
cd UrbanCycling_Dashboard
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y llena los valores:

```bash
cp .env.example .env
```

> Ver la sección [Variables de Entorno](#-variables-de-entorno) para más detalles.

### 4. Levantar la base de datos con Docker

```bash
docker-compose up -d
```

Esto levanta un contenedor MySQL en el puerto `3306`.

### 5. Ejecutar migraciones y seed

```bash
npx prisma migrate dev
npm run seed
```

### 6. Generar el cliente de Prisma

```bash
npx prisma generate
```

### 7. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La app estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de datos
DATABASE_URL="mysql://cycling_admin:cycling_secure_password@localhost:3306/urbancycling_db"

# NextAuth
NEXTAUTH_SECRET="tu_secreto_aqui"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3 (opcional para almacenamiento de archivos)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="tu_access_key"
AWS_SECRET_ACCESS_KEY="tu_secret_key"
AWS_BUCKET_NAME="tu_bucket"
```

> ⚠️ **Nunca subas el archivo `.env` al repositorio.** Está incluido en `.gitignore`.

---

## 🧑‍💻 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo con Turbopack |
| `npm run build` | Compila la aplicación para producción |
| `npm run start` | Inicia el servidor en modo producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run format` | Formatea el código con Prettier |
| `npm run typecheck` | Verifica tipos con TypeScript |
| `npm run seed` | Ejecuta el seed de la base de datos |

---

## 📁 Estructura del Proyecto

```
Urban_Cycling/
├── app/
│   ├── (auth)/          # Páginas de autenticación (login)
│   ├── (routes)/        # Páginas protegidas del dashboard
│   │   ├── bicicletas/
│   │   ├── clientes/
│   │   ├── historial-boletas/
│   │   ├── inventory/
│   │   ├── punto-ventas/
│   │   └── usuarios/
│   └── api/             # API Routes (NextAuth, endpoints REST)
├── components/          # Componentes reutilizables
│   ├── ui/              # Componentes base de shadcn/ui
│   └── SidebarRoutes/   # Navegación del sidebar
├── hooks/               # Custom React hooks
├── lib/                 # Utilidades, permisos y configuración
├── prisma/              # Schema y migraciones de base de datos
├── public/              # Assets estáticos
├── types/               # Definiciones de tipos TypeScript
├── docker-compose.yml   # Configuración Docker para la BD
└── next.config.mjs      # Configuración de Next.js
```

---

## 🤝 Contribución

1. Crea una rama desde `main`:
   ```bash
   git checkout -b feature/nombre-de-la-feature
   ```
2. Realiza tus cambios y haz commit siguiendo [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: descripción del cambio"
   ```
3. Sube tu rama y abre un Pull Request hacia `main`.

---

## 👨‍💻 Equipo

Desarrollado por el equipo de ISW I — Universidad, Semestre 7.

---

## 📄 Licencia

Proyecto académico — uso educativo.
