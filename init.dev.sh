## INICIALIZA EL ENTORNO DE DESARROLLO, LEVANTA CONTENEDORES CON OVERRIDES
## EJECUTA MIGRACIONES Y SEEDERS PARA POBLAR LA BASE DE DATOS CON DATOS DE PRUEBA
## OPCIONALMENTE BORRA VOLUMENES VIEJOS PARA LIMPIAR EL ESTADO ANTERIOR
#!/bin/bash
echo "🛠️ Inicializando entorno de desarrollo..."

# Detener y limpiar todo (incluye volúmenes)
docker compose down -v

# Levantar servicios en segundo plano con override
docker compose up -d

# Aplicar migraciones
docker compose exec backend npx prisma migrate deploy

# Ejecutar seed con datos de prueba
docker compose exec backend npx prisma db seed

echo "✅ Entorno de desarrollo listo con datos iniciales"
