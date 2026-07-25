# ⚽ futbol-platform

Plataforma de gestion de torneos de futbol. Monorepo con API, dashboard admin y app mobile.

## Stack

| App | Tecnologia | Puerto |
|-----|-----------|--------|
| API | Express + Prisma + PostgreSQL | 3001 |
| Admin | Next.js 14 + React 18 + Tailwind | 3000 |
| Mobile | Expo 51 + React Native | 8081 |

## Requisitos

- Node.js >= 20
- PostgreSQL 16
- npm 10.8+

## Instalacion Rapida

```bash
# Clonar repo
git clone <url>
cd futbol-platform

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Levantar base de datos
docker-compose up -d db

# Migrar base de datos
npm run db:migrate

# Datos de prueba (opcional)
npm run db:seed

# Iniciar desarrollo
npm run dev
```

## Estructura del Proyecto

```
futbol-platform/
├── apps/
│   ├── api/                    # Backend REST API
│   │   ├── src/
│   │   │   ├── modules/        # 15 modulos de negocio
│   │   │   │   ├── auth/       # Autenticacion JWT
│   │   │   │   ├── tournaments/# CRUD torneos
│   │   │   │   ├── categories/ # Categorias por torneo
│   │   │   │   ├── teams/      # Equipos
│   │   │   │   ├── players/    # Jugadores + suscripciones
│   │   │   │   ├── referees/   # Arbitros
│   │   │   │   ├── matches/    # Partidos + resultados
│   │   │   │   ├── standings/  # Posiciones / tablas
│   │   │   │   ├── brackets/   # Llaves de eliminacion
│   │   │   │   ├── statistics/ # Estadisticas globales
│   │   │   │   ├── sanctions/  # Sanciones a jugadores
│   │   │   │   ├── club/       # Gestion del club
│   │   │   │   ├── members/    # Socios
│   │   │   │   ├── webhooks/   # MercadoPago webhooks
│   │   │   │   └── notifications/# Notificaciones
│   │   │   ├── middleware/     # Auth, roles, errores, validacion
│   │   │   ├── lib/            # Utilidades, bracket engine
│   │   │   └── config/         # Database, env, variables
│   │   └── prisma/
│   │       ├── schema.prisma   # 14 modelos, 10 enums
│   │       └── seed.ts         # Datos de prueba
│   │
│   ├── admin/                  # Dashboard administrativo
│   │   └── src/
│   │       ├── app/            # Next.js App Router
│   │       │   ├── (dashboard)/# 30+ paginas autenticadas
│   │       │   └── login/      # Pagina de login
│   │       ├── components/     # Componentes UI
│   │       ├── lib/            # API client, auth, utils
│   │       └── providers/      # Auth + Query providers
│   │
│   └── mobile/                 # App para jugadores/socios
│       └── app/
│           ├── (tabs)/         # 5 tabs principales
│           └── *Screen.tsx     # 7 screens de detalle
│
├── packages/
│   ├── types/                  # Tipos TypeScript compartidos
│   ├── constants/              # Labels, enums, valores
│   └── validations/            # Schemas Zod
│
├── docker-compose.yml          # PostgreSQL + Redis
├── Dockerfile                  # Build multi-stage
├── railway.toml                # Config Railway
└── turbo.json                  # Pipeline de build
```

## Modulos de la API

### Autenticacion
- `POST /api/v1/auth/login` — Login con email/username
- `POST /api/v1/auth/refresh` — Refrescar access token
- `GET /api/v1/auth/me` — Usuario actual

### Torneos
- CRUD completo + cambio de estado + estadisticas

### Categorias
- CRUD + toggle activo/inactivo

### Equipos
- CRUD + toggle activo/inactivo

### Jugadores
- CRUD + toggle + suscripciones (bulk, payment links, marcar pagado)

### Arbitros
- CRUD + toggle activo/inactivo

### Partidos
- CRUD + cargar resultado + postergar + generar fixture

### Posiciones
- Por grupo, por categoria, recalcular, crear grupo, agregar equipos

### Llaves
- Por categoria, inicializar bracket

### Estadisticas
- Global, resumen torneo, goleadores, tarjetas, arqueros, juego limpio

### Sanciones
- CRUD + resolver

### Club
- Info, noticias, staff, galeria, canchas, credenciales QR, categorias, pagos, finanzas

### Socios
- Auth de socios, CRUD, vincular jugadores, suscripciones, finanzas

### Webhooks
- Handler de MercadoPago

### Notificaciones
- CRUD + marcar leido/no leido

## Base de Datos

14 modelos principales:
- **User** — Usuarios del admin
- **Tournament** — Torneos
- **Category** — Categorias por torneo
- **Team** — Equipos
- **Player** — Jugadores
- **Match** — Partidos
- **MatchEvent** — Eventos de partido (goles, tarjetas)
- **Group / GroupTeam** — Grupos y posiciones
- **Bracket** — Llaves de eliminacion
- **Sanction** — Sanciones
- **Club** — Datos del club
- **Member** — Socios
- **Payment / Subscription** — Pagos y suscripciones
- **Notification** — Notificaciones

## Desarrollo

### Agregar modulo a la API
```bash
# Usar el comando de opencode
/futbol-module nombre-del-modulo
```

### Agregar pagina al admin
```bash
/futbol-page nombre-de-pagina
```

### Agregar pantalla al mobile
```bash
/futbol-screen nombre-de-pantalla
```

### Crear tests
```bash
/futbol-test ruta/al/archivo.ts
```

### Crear migracion
```bash
/futbol-migrate "descripcion del cambio"
```

### Deploy
```bash
/futbol-deploy
```

## Deploy

### Railway (Produccion)
1. Conectar repo a Railway
2. Configurar variables de entorno en dashboard
3. Push a `main` para auto-deploy
4. Prisma migrate se ejecuta automaticamente al iniciar

### Docker (Local)
```bash
docker-compose up -d
```

## Variables de Entorno

| Variable | App | Descripcion |
|----------|-----|-------------|
| `DATABASE_URL` | API | Connection string PostgreSQL |
| `JWT_SECRET` | API | Secret access tokens (128-char hex) |
| `JWT_REFRESH_SECRET` | API | Secret refresh tokens |
| `PORT` | API | Puerto (default: 3001) |
| `MP_ACCESS_TOKEN` | API | Token MercadoPago |
| `MP_WEBHOOK_SECRET` | API | Secret webhooks MP |
| `NEXT_PUBLIC_API_URL` | Admin | URL base API |

## Licencia

Privado — Diego Caceres 2026
