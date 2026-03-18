# Configuración de Docker

Esta guía explica cómo utilizar Docker y Docker Compose para ejecutar la plataforma de grados.

## Requisitos

- Docker Desktop (incluye Docker y Docker Compose)
  - Windows/Mac: Descargar desde https://www.docker.com/products/docker-desktop
  - Linux: Instalar Docker y Docker Compose por separado

## Archivos Docker

### `docker-compose.yml` (Producción)

Configuración para ambiente de producción con:
- **PostgreSQL 16**: Base de datos principal
- **Backend NestJS**: API REST en puerto 3000

Servicios:
- `postgres`: Base de datos
- `backend`: Aplicación NestJS

Volúmenes:
- `postgres_data`: Persistencia de datos
- `uploads_data`: Almacenamiento de archivos
- `signatures_data`: Certificados y claves digitales

### `docker-compose.dev.yml` (Desarrollo)

Configuración para ambiente de desarrollo con servicios adicionales:
- **PostgreSQL 16**: Base de datos
- **pgAdmin 4**: Herramienta gráfica para administrar PostgreSQL
- **MailHog**: Servidor SMTP para testing de emails

## Ejecución Rápida

### Opción 1: Desarrollo (Recomendado)

```bash
# En la raíz del proyecto
docker-compose -f docker-compose.dev.yml up -d

# Esperar 10-15 segundos para que PostgreSQL inicie

# Aplicar migraciones
cd backend
npm install
npm run prisma:migrate:dev
npm run prisma:seed

# Iniciar backend localmente (para desarrollo)
npm run start:dev
```

Acceso:
- Backend: http://localhost:3000
- PgAdmin: http://localhost:5050 (admin@itp.edu.co / admin_dev)
- MailHog: http://localhost:8025

### Opción 2: Producción

```bash
# En la raíz del proyecto
docker-compose up -d

# Ver logs
docker-compose logs -f backend
```

Acceso:
- Backend: http://localhost:3000

## Comandos Docker Compose Útiles

### Iniciar servicios

```bash
# Iniciar en background
docker-compose up -d

# Iniciar con logs visibles
docker-compose up

# Iniciar desarrollo
docker-compose -f docker-compose.dev.yml up -d
```

### Ver estado

```bash
# Listar contenedores
docker-compose ps

# Ver logs
docker-compose logs

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f postgres

# Ver logs en tiempo real (últimas 50 líneas)
docker-compose logs -f --tail 50
```

### Detener servicios

```bash
# Detener sin eliminar volúmenes
docker-compose stop

# Detener y eliminar contenedores
docker-compose down

# Detener y eliminar todo incluyendo volúmenes (CUIDADO: borra datos)
docker-compose down -v
```

### Reconstruir imágenes

```bash
# Reconstruir sin cache
docker-compose build --no-cache

# Reconstruir e iniciar
docker-compose build && docker-compose up -d
```

### Ejecutar comandos en contenedores

```bash
# Acceder a shell del backend
docker-compose exec backend bash

# Acceder a psql en postgres
docker-compose exec postgres psql -U itp_admin -d plataforma_grados

# Ejecutar comando en backend
docker-compose exec backend npm run prisma:studio
```

## Configuración de Servicios

### PostgreSQL

**Credenciales:**
- Usuario: `itp_admin`
- Contraseña: `itp_dev_2024`
- Base de datos: `plataforma_grados`
- Puerto: `5432`

**Health Check:**
```bash
docker-compose exec postgres pg_isready -U itp_admin -d plataforma_grados
```

### PgAdmin (Desarrollo)

Acceso: http://localhost:5050

**Credenciales:**
- Email: admin@itp.edu.co
- Contraseña: admin_dev

**Conectar PostgreSQL en pgAdmin:**
1. Ir a Dashboard
2. Create > Server
3. Nombre: "PostgreSQL Local"
4. Connection:
   - Host: `postgres` (nombre del servicio)
   - Port: `5432`
   - Username: `itp_admin`
   - Password: `itp_dev_2024`

### MailHog (Desarrollo)

Acceso: http://localhost:8025

MailHog captura automáticamente todos los emails enviados:

```env
# Configuración en backend/.env
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USER=
MAIL_PASS=
MAIL_FROM=noreply@itp.edu.co
```

## Variables de Entorno

### En `docker-compose.yml`

Variables disponibles para sobrescribir:

```yaml
environment:
  POSTGRES_PASSWORD: ${DB_PASSWORD:-itp_dev_2024}  # Default si no está definida
  JWT_SECRET: ${JWT_SECRET}                        # Requerida
  CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:4200}
```

### Crear archivo `.env` para docker-compose

```bash
cat > .env << EOF
DB_PASSWORD=mi_contraseña_segura
JWT_SECRET=mi_jwt_secret_largo_y_seguro
CORS_ORIGIN=http://localhost:4200
EOF
```

## Troubleshooting

### Puerto ya en uso

```bash
# Encontrar proceso usando puerto
lsof -i :5432  # Para PostgreSQL
lsof -i :3000  # Para backend

# Matar proceso
kill -9 <PID>

# Alternativa: cambiar puertos en docker-compose.yml
# ports:
#   - "15432:5432"  # Cambiar 5432 a 15432
```

### PostgreSQL no inicia

```bash
# Ver logs de postgres
docker-compose logs postgres

# Limpiar volúmenes y reintentar
docker-compose down -v
docker-compose up -d
```

### Cambios en código no se reflejan

Dos casos:

1. **Backend en Docker**: Reconstruir imagen
   ```bash
   docker-compose build --no-cache backend
   docker-compose up -d backend
   ```

2. **Backend local con Docker PostgreSQL**: Reiniciar backend
   ```bash
   npm run start:dev  # En otra terminal, Ctrl+C y volver a ejecutar
   ```

### Error: "cannot find module 'bcrypt'"

```bash
# En desarrollo local, reinstalar dependencias
cd backend
npm ci  # Usar npm ci en lugar de npm install

# O en Docker
docker-compose exec backend npm ci
```

### Error de conexión a base de datos

```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps | grep postgres

# Verificar logs
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres

# Esperar a que health check pase
docker-compose ps  # Ver STATUS (debe estar "healthy")
```

## Escenarios de Desarrollo

### Escenario 1: Backend en Docker, Development local

```bash
# Iniciar solo PostgreSQL
docker-compose -f docker-compose.dev.yml up postgres mailhog -d

# En terminal, backend local
cd backend
npm install
npm run prisma:migrate:dev
npm run prisma:seed
npm run start:dev
```

### Escenario 2: Todo en Docker

```bash
# Iniciar todo
docker-compose -f docker-compose.dev.yml up -d

# Esperar a que postgresql esté healthy
docker-compose ps | grep postgres  # Status debe ser "healthy"

# Aplicar migraciones
docker-compose exec backend npm run prisma:migrate:dev

# Ejecutar seed
docker-compose exec backend npm run prisma:seed

# Ver logs
docker-compose logs -f backend
```

### Escenario 3: Development con hot-reload en Docker

Modificar `docker-compose.dev.yml`:

```yaml
backend:
  build:
    context: ./backend
  volumes:
    - ./backend/src:/app/src  # Agregar esto
    - ./backend/prisma:/app/prisma
  command: npm run start:dev  # Agregar esto
```

Luego:
```bash
docker-compose -f docker-compose.dev.yml up -d backend
docker-compose logs -f backend
```

## Limpiar y Resetear

### Eliminar todo excepto código

```bash
# Detener y eliminar contenedores y volúmenes
docker-compose down -v

# Eliminar imágenes
docker rmi -f plataforma-grados-utp-backend postgres:16-alpine

# Reiniciar desde cero
docker-compose up -d
```

### Resetear base de datos

```bash
# Opción 1: Dentro del contenedor
docker-compose exec backend npm run prisma:migrate:dev

# Opción 2: Eliminar volumen y reiniciar
docker-compose down -v
docker-compose up -d postgres
# Esperar a que inicie
docker-compose up -d backend
```

## Performance y Optimización

### Limitar recursos

Agregar a `docker-compose.yml`:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
      reservations:
        cpus: '0.5'
        memory: 256M
```

### Usar BuildKit para builds más rápido

```bash
DOCKER_BUILDKIT=1 docker-compose build
```

### Optimizar tamaño de imagen

Ver `backend/Dockerfile` para multi-stage builds.

## Seguridad en Docker

1. **Cambiar contraseñas en producción**
   ```bash
   # Generar contraseña segura
   openssl rand -base64 32
   ```

2. **No usar `root` en contenedores**
   - Backend corre como usuario `node`
   - PostgreSQL corre como usuario `postgres`

3. **Usar secrets en producción**
   ```bash
   # Con Docker Swarm o Kubernetes
   docker secret create jwt_secret -
   ```

## Monitoreo

### Healthchecks

Ver estado de salud de los servicios:

```bash
docker-compose ps
# STATUS column muestra "healthy" si los checks pasan
```

### Métricas

```bash
# Ver uso de recursos en tiempo real
docker stats
```

## Referencias

- Docker Documentation: https://docs.docker.com
- Docker Compose Documentation: https://docs.docker.com/compose
- PostgreSQL Docker: https://hub.docker.com/_/postgres
- PgAdmin Docker: https://hub.docker.com/r/dpage/pgadmin4
- MailHog: https://github.com/mailhog/MailHog

---

**Última actualización**: Marzo 2026
