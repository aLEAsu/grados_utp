## DETIENE EL ENTORNO DE DESARROLLO, ELIMINA CONTENEDORES Y VOLUMENES
#!/bin/bash
echo "🛑 Deteniendo entorno de desarrollo..."

# Detener y eliminar volúmenes
docker compose down -v

echo "✅ Todo detenido y volúmenes eliminados"

