# Para detener la plataforma de grados ITP, usar el comando `./stop.sh` en la terminal. 
# Es importante ejecutar este comando para asegurarse de que los contenedores se detengan correctamente y no queden procesos en segundo plano consumiendo recursos innecesarios.
# Este archivo es para levantar el entorno de desarrollo, si se desea levantar el entorno de producción, 
# se debe eliminar o renombrar el archivo `docker-compose.override.yml` para que no sobrescriba la configuración principal 
# del `docker-compose.yml`. y ahi si ejecutar este archivo `stop.sh` para detener el entorno de producción.

#!/bin/bash
echo " Deteniendo Plataforma de Grados ITP..."
docker compose down
echo " Contenedores detenidos y recursos liberados"
